import { Exception, SyntaxErrorException } from "../classes/exception";
import { p } from "../classes/position";
import { TOKEN_BLOCKSEP, TOKEN_CBRACK, TOKEN_CPAREN, TOKEN_DOT, TOKEN_NEWL, TOKEN_OBRACK, TOKEN_OPAREN } from "../lexer/constants";
import Token from "../lexer/token";
import { ERROR_INVALIDASSIGN, ERROR_MEMACCESSDOT } from "../strings";
import grammarRules from "./grammarRules.json";
import { FuncArgsNode, FuncCallNode, MemberAccessNode, MemberAssignNode } from "./nodes";
import ParserRuleAdapter, { Rule } from "./ruleAdapter";

export type ParserCurrentState = {
    index: number
    token: Token | null
}

export type RuleReturn = Exception | any[];

export default class Parser {

    current: ParserCurrentState = {
        index: -1,
        token: null
    }

    tokens: Token[];
    text?: string;

    constructor (tokens: Token[], text?: string) {
        this.tokens = tokens;
        this.text   = text;
    }

    parse () {
        // initialize current state
        this.next();

        // the most outer rule is block, create it and return the result node
        const ruleAdapter = new ParserRuleAdapter();

        // if the rule returned an error, pass it on
        let ps = this.current.token!.range!.clone().start;

        const block = this.rule('block');
        if (block instanceof Exception) return block;

        let pe = this.current.token?.range!.clone().end;

        // if the resulting node contains an error, raise it
        const node = ruleAdapter.getCorrespondingNode(block, "block", true, p(ps, pe, this.text));
        if (ruleAdapter.doesBlockContainsError(node)) {
            this.next();
            return ruleAdapter.getSyntaxError(this.current.token!);
        }

        // otherwise, return the node as is
        return node;
    }


    // recursive rule function

    protected rule = (name: string, rec: number = 0): RuleReturn => {
        // setup
       
        const ruleDataFull = [...(grammarRules as any)[name]];
        const ruleNode: string = ruleDataFull.pop();
        const ruleData: Rule   = ruleDataFull;

        const ruleAdapter = new ParserRuleAdapter();
        if (!ruleData) return [];

        let nodes: any[] = [];
        let step = 0;
        let variation = 0;

        let finished = false;
        let error = false;

        let isBlock  = false;
        if (name == 'case') isBlock = true;

        let ignoreNewLines = true;

        // if this rule contains "@NEWL" inside one of its variations
        // this means that it doesnt ignore new lines
        if (ruleAdapter.doesRuleListenToNewLines(ruleData)) {
            ignoreNewLines = false;

            // if the token right before the current one (skipped) is a new line
            // push the BLOCKSEP token (automatic semicolon placement) and finish the iteration
            this.prev();
            if (this.current.token!.type == TOKEN_NEWL) {
                nodes.push(new Token(TOKEN_BLOCKSEP));
                finished = true;
            };
            this.next();
        }

        // go to the next variation, if none left, finish
        const tryNextVariation = () => {
            variation++;

            // if none left, finish
            if (variation >= ruleData.length) {
                finished = true;

                // another hardcoded rule, because I didn't find any other way
                // TODO: remove or generalize
                if (name == 'varAssign' && nodes.length == 1) {
                    nodes = [];
                    this.prev();
                }

                // if no variation matches in the most outer role, throw error
                if (rec == 0) {
                    this.next();
                    error = true;
                }

            // if found a special "**" instruction,
            // begin a block and reset both the step and the variation
            } else if (ruleAdapter.isABlockRepeatInstruction(ruleData, variation, step)) {
                step = 0;
                variation = 0;
                isBlock = true;
                finished = false;
            }
        }

        // go to the next step and advance
        const nextStep = () => {
            step++;
            this.next();
            
            // if the steps ended, finish
            if (!ruleData[variation][step]) 
                finished = true;
            
            // if found a special "*" instruction,
            // make replace nodes with [newNode(nodes)]
            // and reset the step (recursive binary operation joining)
            else if (ruleAdapter.isABinaryRepeatInstruction(ruleData, variation, step)) {
                step = 1;
                if (name == "member") variation = 0;
                let ps = nodes[0].range?.start;
                let pe = nodes[nodes.length-1].range?.end;
                const targetNode = ruleAdapter.getCorrespondingNode(nodes, ruleNode, false, p(ps!, pe, this.text));
                if (targetNode) nodes = [targetNode];
            }

            // if found a special "**" instruction,
            // begin a block and reset the step
            else if (ruleAdapter.isABlockRepeatInstruction(ruleData, variation, step)) {
                step = 0;
                isBlock = true;
                finished = false;
            }
        }


        // main loop
        //if (rec > -1 || rec == -99999) console.log(this.indent(rec), 'entered rule', name);
        while (!finished && this.current.token) {
            // get the #step from #variation from the rule (the current item)
            const item = ruleData[variation][step];

            // if it's a token, check whether it is the same as the current token
            // if so, push it and advance
            // if not, try next variation
            if (ruleAdapter.isToken(item)) {
                // if this rule ignores new lines and the current token is a newline, skip
                if (ignoreNewLines && this.current.token.type == TOKEN_NEWL) {
                    this.next();
                    continue;
                }

                const token = ruleAdapter.getToken(item);
                
                if (ruleAdapter.matchesToken(token, this.current.token)) {
                    if (!token.skip) nodes.push(this.current.token);
                    nextStep();
                } else tryNextVariation();

            // if it's a rule, recursively get it
            // then get the corresponding node based on the return result
            // if it exists, push it and advance
            } else if (ruleAdapter.isRule(item)) {
                // get the recursive rule and it's corresponding node
                // if the rule returned no result, try next variation
                let ps = this.current.token!.range!.clone().start;

                const ruleName = item.slice(1);
                const nodeData = this.rule(ruleName, rec+1);

                let pe = this.current.token?.range!.clone().end;

                // if returned an exception, pass it on
                if (nodeData instanceof Exception) return nodeData;

                // another hardcoded rule for case, jesus christ
                if (!nodeData.length && name == 'case') this.prev();
                if (!nodeData.length && ruleName != 'block') {
                    tryNextVariation();
                    continue;
                }
                
                const targetRuleNode = ruleAdapter.getRuleNode(ruleName);
                let targetNode = ruleAdapter.getCorrespondingNode(nodeData, targetRuleNode, isBlock, p(ps, pe, this.text));

                if (targetNode instanceof MemberAccessNode) {
                    let closeTok = targetNode.closeTok;

                    // if the target node is a member access node that has "(" as the operator, convert to function call node
                    if (targetNode.operator.type == TOKEN_OPAREN)
                        targetNode = new FuncCallNode(targetNode.expr, (targetNode.member as FuncArgsNode)).setPos(targetNode.range);
                    
                    // if the expression after the "." is not an identifier, throw error
                    else if (targetNode.operator.type == TOKEN_DOT && targetNode.closeTok) {
                        return new SyntaxErrorException(ERROR_MEMACCESSDOT, targetNode.member.range)
                    }

                    // if not found the closing "]" for "[" or ")" for "(", throw error
                    else if (
                        targetNode.operator.type == TOKEN_OBRACK && !ruleAdapter.isClosing(closeTok, TOKEN_CBRACK) ||
                        targetNode.operator.type == TOKEN_OPAREN && !ruleAdapter.isClosing(closeTok, TOKEN_CPAREN)
                    ) {
                        error = true;
                        if (!closeTok?.type || ![TOKEN_CBRACK, TOKEN_CPAREN].includes(closeTok.type)) this.next();
                        break;
                    }
                }

                // if member assign node is not assigning to a member, throw an error
                if (targetNode instanceof MemberAssignNode) {
                    if (!(targetNode.member instanceof MemberAccessNode))
                        return new SyntaxErrorException(ERROR_INVALIDASSIGN, targetNode.member.range)
                }

                if (ruleAdapter.doesBlockContainsError(targetNode)) {
                    this.next();
                    error = true;
                    break;
                }

                // if is block, push it's nodes into the current node list directly 
                // (to avoid nested blocks)
                if (isBlock) {
                    // special hardcoded (sorry) logic for the case rule
                    if (name == 'case')
                        nodes.push(targetNode);
                    else
                        nodes.push(...targetNode.nodes);
                }

                // otherwise just push the node
                else if (targetNode) nodes.push(targetNode);

                // if there's no node, finish
                else {
                    nodes.push(...nodeData);
                }

                // advance
                nextStep();

            // if all fails, that means the current variation steps ended, 
            // move on to the next one
            } else {
                tryNextVariation();
            }
        }

        // back up by one after finishing the rule and return the nodes (unless no nodes found)

        //if (rec > -1 || rec == -99999) console.log(this.indent(rec), 'exited rule', name, nodes);
        if (nodes.length || (error && !this.current.token)) this.prev();
        if (error && this.current.token?.type == TOKEN_NEWL) this.next();

        return error
            ? ruleAdapter.getSyntaxError(this.current.token!)
            : nodes;

    }


    // advance and back up

    protected next () {
        this.current.index++;
        this.current.token = this.tokens[this.current.index] || null;
    }

    protected prev () {
        this.current.index--;
        this.current.token = this.tokens[this.current.index] || null;
    }

    protected goTo (index: number) {
        this.current.index = index;
        this.current.token = this.tokens[this.current.index] || null;
    }

    // todo remove, this is for debugging purposes only
    protected indent (n: number) {
        let s = '';
        for (let i = 0; i < n; i++) s += '  ';
        return s;
    }

}