import { SyntaxErrorException } from "../classes/exception";
import { PositionRange } from "../classes/position";
import { ATOMS, SYMBOLS, TOKEN_IDENTIFIER, TOKEN_KEYWORD } from "../lexer/constants";
import Token from "../lexer/token";
import { ERROR_UNEXP_TOKEN, h } from "../strings";
import { BaseNode, BlockNode, CasesNode, NODE_INPUT_NODES, NODE_MAP } from "./nodes";

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

    getCorrespondingNode (nodes: any[], isBlock: boolean = false, range?: PositionRange) {
        // if is block, just create a new BlockNode
        if (isBlock) return new BlockNode(...nodes).setPos(range);

        // get the desired node from the node map based on the string representation
        let r = this.getNodeMapEntry(nodes);

        // if the result is the "pass" keyword, pass the first node from the parameter, otherwise create a new node
        if (r == 'pass') {
            if (nodes.length == 1) return nodes[0];
            else return new BlockNode(...nodes).setPos(range);
        }
        if (r === true)  return true;
        return r ? new r(...nodes).setPos(range) : null;
    }

    getNodeMapEntry (nodes: any[]) {
        // this function is extremely hard to explain
        // but basically, it checks against every entry in NODE_MAP
        // to see if the given nodes list matches with it
        // returns that entry, if found

        let entry: any;
        Object.keys(NODE_MAP).forEach(k => {
            let pass = true;
            const spl = k.split(',');

            spl.forEach((elem, index) => {
                if (!pass) return;

                const elemPrf = elem[0];
                const elemSpl = elem.slice(1).split(':');

                if (elemPrf == '@' && !(nodes[index] instanceof Token))    return pass = false;
                if (elemPrf == '%'  && !(nodes[index] instanceof BaseNode)) return pass = false;

                if (elemSpl[0] && nodes[index].type  != elemSpl[0]) return pass = false;
                if (elemSpl[1] && nodes[index].value != elemSpl[1]) return pass = false;

                return;
            });

            if (pass) entry = k;
        });

        return (NODE_MAP as any)[entry];
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