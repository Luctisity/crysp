import { Exception, IllegalCharacterException } from "../classes/exceptions";
import { Position, PositionRange } from "../classes/position";
import { isWhitespace, isNumeric, isNumericFloat, isDot, isWord, isKeyword } from "../util/util";
import { NUMERIC_DOT } from "./constants";
import Token from "./token";
import { tokenMap, TOKEN_FLOAT, TOKEN_INT, TOKEN_END, TOKEN_IDENTIFIER, TOKEN_KEYWORD } from "./tokenTypes";

export type LexerCurrentState = {
    pos: Position,
    char: string | null
}

export default class Lexer {

    text: string;

    current: LexerCurrentState = {
        pos: new Position(-1, 1, 0),
        char: null
    }

    constructor (text: string) {
        this.text = text;
        this.next();
    }

    // advance to the next character
    next () {
        this.current.pos.next(this.current.char);
        let pos = this.current.pos;

        this.current.char = (pos.idx < this.text.length) 
            ? this.text[pos.idx] 
            : null;
    }

    // make all tokens
    makeTokens () {
        const tokens: Token[] = [];

        while (this.current.char) {
            let char = this.current.char;

            // whitespaces (ignore)
            if (isWhitespace(char)) 
                this.next();

            // numeric tokens
            else if (isNumericFloat(char)) {
                let n = this.makeNumeric();
                if (n instanceof Exception) return [null, n];

                tokens.push(n);
            }

            // identifier and keyword tokens
            else if (isWord(char)) {
                tokens.push(this.makeWord());
            }

            // simple operation tokens
            else if (tokenMap[char]) {
                tokens.push(new Token(tokenMap[char], undefined, this.current.pos, this.current.pos));
                this.next();
            }

            // unrecognized character
            else {
                let ps = this.current.pos.clone();
                let pe = this.current.pos;
                let p = new PositionRange(ps, pe);

                return [null, new IllegalCharacterException(p.plusOne(), char, this.text)];
            }

        }

        tokens.push(new Token(TOKEN_END, undefined, this.current.pos, this.current.pos));
        return [tokens, null];
    }

    // construct a numeric token (floats and ints)
    makeNumeric () {
        let dots = 0;
        let ps = this.current.pos.clone();
        let lastDotPos = ps;

        let s = this.advanceWhile(isNumericFloat, (char: string) => {
            if (isDot(char)) {
                dots++;
                lastDotPos = this.current.pos.clone();
            }
        });

        // handle errors
        let char = this.current.char;
        let error: any;

        if (char && isWord(char) && !isNumeric(char)) error = new IllegalCharacterException(new PositionRange(this.current.pos), char, this.text);
        else if (dots > 1)                    error = new IllegalCharacterException(new PositionRange(lastDotPos), NUMERIC_DOT, this.text);
        
        if (error) return error;

        // if dot count is 0, return an integer token, otherwise a float token
        const possibleTokens = [TOKEN_INT, TOKEN_FLOAT];
        const possibleFuncs  = [parseInt, parseFloat];
        return new Token(possibleTokens[dots], possibleFuncs[dots](s), ps, this.current.pos.prev());
    }

    // construct word tokens (identifiers and keywords)
    makeWord () {
        let ps = this.current.pos.clone();
        let s = this.advanceWhile(isWord);

        // if the keywords list includes the word, return a keyword token, otherwise an identifier token
        const possibleTokens = [TOKEN_IDENTIFIER, TOKEN_KEYWORD];
        const selectedToken  = possibleTokens[+isKeyword(s)];
        return new Token(selectedToken, s, ps, this.current.pos.prev());
    }

    // for looping through characters
    private advanceWhile(cond: Function, logic?: Function, ...args: any) {
        let s = '';
        while (this.current.char && cond(this.current.char)) {
            let char = this.current.char;

            if (logic) logic(char, ...args);

            s += char;
            this.next();
        }
        return s;
    }

}