import { InvalidSyntaxException } from "../classes/exceptions";
import Token from "../lexer/token";
import { TOKEN_ADD, TOKEN_DIV, TOKEN_END, TOKEN_FLOAT, TOKEN_INT, TOKEN_MUL, TOKEN_OPAREN, TOKEN_CPAREN, TOKEN_SUB, TOKEN_POW, TOKEN_KEYWORD, TOKEN_IDENTIFIER, TOKEN_ASSIGN } from "../lexer/tokenTypes";
import { NodeAssignment, NodeBinaryOp, NodeNumeric, NodeUnaryOp, NodeVariable } from "./nodes";
import ParseResult from "./parseResult";

export type ParserCurrentState = {
    idx: number,
    token: Token | null
}

export default class Parser {

    text?:  string;
    tokens: Token[];
    current: ParserCurrentState = {
        idx: -1,
        token: null
    }

    constructor (tokens: Token[], text?: string) {
        this.tokens = tokens;
        this.text = text;
        this.next();
    }

    // advance to the next token
    next () {
        this.current.idx++;
        let idx = this.current.idx;

        if (idx < this.tokens.length) 
            this.current.token = this.tokens[idx];

        return this.current.token;
    }

    // parse top-level expression. If failed, return an error
    parse () {
        let result = this.makeExpr();
        if (!result.exception && this.current.token?.type != TOKEN_END) {
            return result.fail(new InvalidSyntaxException(
                this.current.token?.range!, "Expected an operator", this.text
            ));
        }
        return result;
    }

    makeAtom = () => {
        let token = this.current.token;
        if (!token) return;

        let result = new ParseResult();

        // numeric node
        if (token.type == TOKEN_INT || token.type == TOKEN_FLOAT) {
            this.registeredNext(result);
            return result.success(new NodeNumeric(token));
        }

        // identifier
        if (token.type == TOKEN_IDENTIFIER) {
            this.registeredNext(result);
            return result.success(new NodeVariable(token));
        }

        // parenthesis
        else if (token.type == TOKEN_OPAREN) {
            this.registeredNext(result);
            
            let expr = result.register(this.makeExpr());
            if (result.exception) return result;

            if (this.current.token?.type == TOKEN_CPAREN) {
                this.registeredNext(result);
                this.registeredNext(result);
                return result.success(expr);
            } else {
                return result.fail(new InvalidSyntaxException(
                    token.range!, "Expected a closing parenthesis ')'", this.text
                ));
            }
        }

        return result.fail(new InvalidSyntaxException(
            token.range!, "Unexpected token", this.text
        ));
    }

    makePower = () => {
        return this.makeBinaryOp(this.makeAtom, [TOKEN_POW], this.makeFactor);
    }

    makeFactor = () => {
        let token = this.current.token;
        if (!token) return;

        let result = new ParseResult();
        
        // unary node
        if (token.type == TOKEN_ADD || token.type == TOKEN_SUB) {
            this.registeredNext(result);

            let factor = result.register(this.makeFactor());
            if (result.exception) return result;

            return result.success(new NodeUnaryOp(factor, token));
        }

        return this.makePower();
    }

    makeTerm = () => {
        return this.makeBinaryOp(this.makeFactor, [TOKEN_MUL, TOKEN_DIV]);
    }

    makeExpr = () => {
        let result = new ParseResult();

        if (this.current.token?.sameAs(TOKEN_KEYWORD, 'let')) {
            this.registeredNext(result);
            let token = this.current.token;

            if (token.type != TOKEN_IDENTIFIER) return result.fail(
                new InvalidSyntaxException(
                    token.range!, "Expected an identifier"
                )
            );

            let varName = token;
            this.registeredNext(result);
            token = this.current.token;

            if (token.type != TOKEN_ASSIGN) return result.fail(
                new InvalidSyntaxException(
                    token.range!, "Expected an assignment operator '='"
                )
            );

            this.registeredNext(result);
            token = this.current.token;

            let expr = result.register(this.makeExpr());
            if (result.exception) return result;

            return result.success(new NodeAssignment(varName, expr));
        }

        return this.makeBinaryOp(this.makeTerm,   [TOKEN_ADD, TOKEN_SUB]);
    }

    // parse a binary operation with a left and right nodes alongside an operator token
    makeBinaryOp = (rule: Function, tokenOptions: any[], rule2?: Function) => {
        let result = new ParseResult();

        let nodeLeft: any = result.register(rule());
        if (result.exception) return result;

        while (tokenOptions.includes(this.current.token!.type!)) {
            let operator:  any = this.current.token;
            this.registeredNext(result);

            let nodeRight: any = result.register(rule2 ? rule2() : rule());
            if (result.exception) return result;

            nodeLeft = new NodeBinaryOp(nodeLeft, nodeRight, operator);
        }

        return result.success(nodeLeft);
    }

    // register the next method with the ParseResult

    registeredNext (result: ParseResult) {
        return result.register(this.next());
    }

}