import { SyntaxErrorException } from "../classes/exception";
import { PositionRange } from "../classes/position";
import { ATOMS, SYMBOLS, TOKEN_CPAREN, TOKEN_FLOAT, TOKEN_IDENTIFIER, TOKEN_INT, TOKEN_KEYWORD, TOKEN_OPAREN, TOKEN_STRING } from "../lexer/constants";
import Token from "../lexer/token";
import { ERROR_UNEXP_TOKEN, h } from "../strings";
import { AtomNode, BlockNode, BreakNode, CasesNode, ContinueNode, FuncCallNode, NODES, NODE_INPUT_NODES, ReturnNode } from "./nodes";
import grammarRules from "./grammarRules.json";

export type Rule = string[][];

export default class ParserRuleAdapter {
    
    isToken (what: string) {
        return what && what.startsWith('@');
    }

    isRule (what: string) {
        return what && what.startsWith('$');
    }

    matchesToken (what: any, token: Token | null) {
        if (!token) return false;

        const matchType = token.type == what.type;
        const matchValue = what.value ? token.value == what.value : true;

        return matchType && matchValue;
    }

    isABlockRepeatInstruction (ruleData: Rule, variation: number, step: number) {
        return ruleData[variation][step] == "**";
    }

    isABinaryRepeatInstruction (ruleData: Rule, variation: number, step: number) {
        return ruleData[variation][step] == "*";
    }

    getCorrespondingNode (nodes: any[], ruleNode: string, isBlock: boolean = false, range?: PositionRange) {
        // if is block, just create a new BlockNode
        if (isBlock) return new BlockNode(...nodes).setPos(range);
        let r;
        let singleNodeMatch = this.getSingleNode(nodes);

        // if the node data matches an atom, create an Atom node
        if (this.isAtom(nodes)) {
            r = AtomNode;
        }
        // if the node data matches a other special cases, create a required node
        else if (this.isFunctionCall(nodes)) {
            r = FuncCallNode;
        }
        else if (singleNodeMatch) {
            r = singleNodeMatch;
        }
        // if the result is the "pass" keyword or the nodes list contains just one node
        // pass the first node from the parameter
        else if (ruleNode == 'pass' || nodes.length == 1) {
            if (nodes.length == 1) return nodes[0];
            else return new BlockNode(...nodes).setPos(range);
        }
        // otherwise, find the node using the ruleNode string
        else r = NODES[ruleNode];

        return r ? new r(...nodes).setPos(range) : null;
    }

    isAtom (nodes: any[]) {
        // an atom must only contain one node and it has to be a token
        if (nodes.length > 1) return false;
        if (!(nodes[0] instanceof Token)) return false;

        // a token must either be numeric, string, identifier or a "true"/"false"/"null" keyword
        if ([TOKEN_INT, TOKEN_FLOAT, TOKEN_STRING, TOKEN_IDENTIFIER].includes(nodes[0].type)) return true;
        if (nodes[0].type == TOKEN_KEYWORD && ['true', 'false', 'null'].includes(nodes[0].value)) return true;

        return false;
    }

    isFunctionCall (nodes: any[]) {
        // if a node list contains non-tokens or just one token, not a function call
        if (nodes.length < 2) return false;
        if (!(nodes[0] instanceof Token)) return false;

        // a function call must start with an idetifier
        if (nodes[0].type != TOKEN_IDENTIFIER) return false;

        // a function call must have parenthesis after identifier
        if (nodes[1].type != TOKEN_OPAREN) return false;
        if (nodes[nodes.length-1].type != TOKEN_CPAREN) return false;

        return true;
    }

    getSingleNode (nodes: any[]) {
        if (!nodes[0] || nodes[0].type != TOKEN_KEYWORD) return false;

        switch (nodes[0].value) {
            case "return":   return ReturnNode;
            case "break":    return BreakNode;
            case "continue": return ContinueNode;
        }

        return false;
    }

    isBreak (nodes: any[]) {
        return nodes[0].type == TOKEN_KEYWORD && nodes[0].value == "return";
    }

    isContinue (nodes: any[]) {
        return nodes[0].type == TOKEN_KEYWORD && nodes[0].value == "return";
    }

    getRuleNode (name: string) {
        const ruleDataFull = [...(grammarRules as any)[name]];
        const ruleNode: string = ruleDataFull.pop();
        return ruleNode;
    }

    getToken (s: string) {
        // turn @TOKEN grammar rule string into an object format
        // examples: @ADD, @KEYWORD:if, @CPAREN&

        s = s.slice(1);
        let tokenSpl = s.split(":");

        // if ends with &, make a skip token
        let skip = false;
        if (s.endsWith("&")) {
            tokenSpl[tokenSpl.length - 1] = tokenSpl[tokenSpl.length - 1].slice(0, -1);
            skip = true;
        }

        return {
            type:  tokenSpl[0],
            value: tokenSpl[1],
            skip:  skip
        }
    }

    doesRuleListenToNewLines (rule: Rule) {
        return rule.filter(f => f.includes("@NEWL")).length;
    }

    doesBlockContainsError (targetNode: any) {
        let error = false;

        // if a block contains raw tokens (not wrapped inside a node), error
        if (targetNode instanceof BlockNode && targetNode.nodes.filter(f => f instanceof Token).length) 
            error = true;
        // if a cases list nodes ends with a case keyword, error
        else if (targetNode instanceof CasesNode && targetNode.nodes[targetNode.nodes.length-1] instanceof Token) 
            error = true;
        // if one of the fields of the node is a token and it's not supposed to be, error
        else if (targetNode) {
            NODE_INPUT_NODES.forEach(nodeName => {
                if (error) return;
                if (targetNode[nodeName] && targetNode[nodeName] instanceof Token) error = true;
            });
        }

        return error;
    }

    serializeToken (token: Token) {

        const type = token.type;

        // for words, return the value (the word itself)
        if (type == TOKEN_IDENTIFIER || type == TOKEN_KEYWORD) return token.value;

        // for strings and numbers, search the type in a special map and return the result
        const atomType = Object.keys(ATOMS).indexOf(type);
        if (atomType >= 0) return Object.values(ATOMS)[atomType];

        // for symbols, search the key in the symbols map and return it
        const symbolType = Object.values(SYMBOLS).indexOf(type);
        if (symbolType >= 0) return Object.keys(SYMBOLS)[symbolType];

        // if all fails, just stringify the token
        return token.toString();

    }

    getSyntaxError (token?: Token) {
        if (!token) return new SyntaxErrorException(h(ERROR_UNEXP_TOKEN, ''));

        return new SyntaxErrorException(h(ERROR_UNEXP_TOKEN, this.serializeToken(token)), token.range?.clone())
    }

}