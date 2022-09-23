import Token from "../lexer/token";
import { BaseNode, BlockNode, NODE_MAP } from "./nodes";

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

    getCorrespondingNode (nodes: any[], isBlock: boolean = false) {
        // if is block, just create a new BlockNode
        if (isBlock) return new BlockNode(...nodes);

        // get the desired node from the node map based on the string representation
        let r = this.getNodeMapEntry(nodes);

        // if the result is the "pass" keyword, pass the first node from the parameter, otherwise create a new node
        if (r == 'pass') {
            if (nodes.length == 1) return nodes[0];
            else return new BlockNode(...nodes);
        }
        if (r === true)  return true;
        return r ? new r(...nodes) : null;
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

}