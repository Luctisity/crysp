import Token from "./token";
import { Exception, IllegalCharException } from "../classes/exception";
import { 
    getStringEscapeCode, hasSymbolsStartWith, isComment, isCommentEnd, isDot, 
    isExp, isFloatNumeric, isFloatNumericExp, isKeyword, 
    isNumeric, 
    isStringQuote, isSymbol, isWhitespace, isWord 
} from "./util";
import { 
    COMMENT_NEWLINE, NUMERIC_DOT, NUMERIC_EXP, SYMBOLS, TOKEN_FLOAT, 
    TOKEN_IDENTIFIER, TOKEN_INT, TOKEN_KEYWORD, TOKEN_STRING 
} from "./constants";
import { ERROR_NUMERIC_IDNTF, ERROR_UNCLOSED_STR, ERROR_UNEXP_CHAR, h } from "../strings";
import Position, { p } from "../classes/position";

export type LexerCurrentState = {
    pos:  Position,
    char: string | null,
    symbolStr: string
}

export type LexerResult = [Token[] | Exception, string | undefined]

export default class Lexer {

    current: LexerCurrentState = {
        pos: new Position(-1, 1, 0),
        char: null,
        symbolStr: ""
    }

    prevSymbolStr: string = "";
    symbol: any;

    text: string;
    textPart?: string;

    constructor (text: string) {
        this.text = text;
        this.next(this.text);
    }

    tokenize (): LexerResult {
        this.rewind(this.text);

        // a list of all commands as strings, separated
        let textStripped: string = "";

        while (this.current.char) {
            let comment = isComment(this.text, this.current.pos.index);

            // if found a comment symbol at the current 
            // position, strip it from the text
            if (comment) this.stripComment(comment);

            // otherwise just add the current char to the 
            // current command string (unless it's null)
            else textStripped += this.current.char || "";

            // advance
            this.next(this.text);
        }

        textStripped += ' ';

        // tokenize
        this.textPart = textStripped;
        this.rewind();
        let t = this.tokenizePart();
        return [t, this.textPart];
    }

    tokenizePart = () => {

        const tokens: Token[] = [];

        while (this.current.char) {
            let char = this.current.char;
            this.symbol = this.makeSymbol();
            if (this.symbol instanceof Exception) return this.symbol;

            // previous string is a symbol
            if (this.symbol) {
                tokens.push(this.symbol);
            }

            // whitespace
            else if (isWhitespace(char)) {
                this.next();
            }

            // string
            else if (isStringQuote(char)) {
                let s = this.makeToken(tokens, this.makeString, char);
                if (s instanceof Exception) return s;
            }

            // numeric (if found dot, check if the character immediately after it is 0-9)
            else if (isFloatNumeric(char) && (char == NUMERIC_DOT ? isNumeric(this.textPart![this.current.pos.index+1]) : true)) {
                console.log(char == NUMERIC_DOT && isNumeric(this.textPart![this.current.pos.index+1]))
                let n = this.makeToken(tokens, this.makeNumber, char);
                if (n instanceof Exception) return n;
            }

            // identifiers
            else if (isWord(char)) {
                this.makeToken(tokens, this.makeWord, char);
            }

            // unknown token
            else {
                if (!this.current.symbolStr) {
                    return new IllegalCharException(h(ERROR_UNEXP_CHAR, char), p(this.current.pos, this.text));
                }

                this.next();
            }

            this.prevSymbolStr = this.current.symbolStr;
        }

        return tokens;

    }

    protected makeToken = (tokens: Token[], func: Function, ...args: any) => {
        let t = func(args);
        tokens.push(t);
        this.next();
        return t;
    }

    protected makeString = (closeSymbol: string) => {
        let s = '';
        let ps = this.current.pos.clone();
        this.next();

        // loop through all the character until a closing quote is found or the end is reached
        while (this.current.char && this.current.char != closeSymbol) {
            let char = this.current.char;

            if (char == COMMENT_NEWLINE) {
                this.prev();
                return new IllegalCharException(ERROR_UNCLOSED_STR, p(this.current.pos.prev().prev(), this.text));
            }

            // if the char is a backslash, treat it as an escape command for the next char
            if (char == '\\') {
                this.next();
                let nextChar = this.current.char;
                // if no next char, throw error
                if(!nextChar) return new IllegalCharException(ERROR_UNCLOSED_STR, p(this.current.pos.prev().prev(), this.text));
                s += getStringEscapeCode(nextChar);
            } else {
                s += char;
            }

            this.next();
        }

        // if reached the end, but no closing quote is found, throw error
        if (!this.current.char) return new IllegalCharException(ERROR_UNCLOSED_STR, p(this.current.pos.prev().prev(), this.text))

        // add symbol immediately after the string
        this.symbol = this.makeSymbol();

        // otherwise, return the result string as a token
        let pe = this.current.pos.clone();
        return new Token(TOKEN_STRING, s, p(ps, pe, this.textPart));
    }

    protected makeNumber = () => {
        let n = '';
        let dots = 0;
        let exps = 0;
        let dotAfterExp = false;
        let nothingAfterExt = false;
        let ps = this.current.pos.clone();

        while (this.current.char && isFloatNumericExp(this.current.char)) {
            let char = this.current.char;
            n += char;
            nothingAfterExt = false;

            if (isDot(char)) {
                dots++;
                if (exps) dotAfterExp = true;
            }
            else if (isExp(char)) {
                exps++;
                nothingAfterExt = true;
            }

            this.next();
        }

        // if immediately proceeded by a word character, throw error
        if (isWord(this.current.char!)) return new IllegalCharException(ERROR_NUMERIC_IDNTF, p(this.current.pos.prev().prev(), this.text));

        // if dot cound is more than 1, throw error
        if (dots > 1) return new IllegalCharException(h(ERROR_UNEXP_CHAR, NUMERIC_DOT), p(this.current.pos.prev().prev(), this.text));

        // if exponent symbol count is more than 1 or if there's a dot after it, throw error
        if (exps > 1 || nothingAfterExt) return new IllegalCharException(h(ERROR_UNEXP_CHAR, NUMERIC_EXP), p(this.current.pos.prev().prev(), this.text));
        if (dotAfterExp)                 return new IllegalCharException(h(ERROR_UNEXP_CHAR, NUMERIC_DOT), p(this.current.pos.prev().prev(), this.text));

         // add symbol immediately after the number
        this.symbol = this.makeSymbol();

        let pe = this.current.pos.clone().prev();

        // if dot count is 0, return an integer, otherwise float
        let possibleTypes = [TOKEN_INT, TOKEN_FLOAT];
        let possibleFuncs = [parseInt,  parseFloat ];
        return new Token(
            possibleTypes[dots||exps], possibleFuncs[dots||exps](n), 
            p(ps, pe, this.textPart)
        );
    }

    protected makeWord = () => {
        let w = '';
        let ps = this.current.pos.clone();

        while (this.current.char && isWord(this.current.char)) {
            let char = this.current.char;
            w += char;
            this.next();
        }

        // add symbol immediately after the word
        this.symbol = this.makeSymbol();

        let pe = this.current.pos.clone().prev();

        let type = isKeyword(w) ? TOKEN_KEYWORD : TOKEN_IDENTIFIER;
        return new Token(type, w, p(ps, pe, this.textPart));
    }

    protected makeSymbol = () => {
        // add current character to the symbol string
        this.current.symbolStr += this.current.char;

        let symbolStr = this.current.symbolStr;

        // if the current symbol string doesn't match any symbols
        if (symbolStr && !isSymbol(symbolStr)) {

            // reset the symbol string
            if (!hasSymbolsStartWith(symbolStr)) {
                this.current.symbolStr = '';
            }

            // if it did  match a symbol on previous iteration, construct a symbol token
            if (isSymbol(this.prevSymbolStr)) {
                let type = SYMBOLS[this.prevSymbolStr];
                if (type) {
                    let pe = this.current.pos.clone().prev();
                    let ps = pe.clone().rewindBy(this.prevSymbolStr.length-1);
                    return new Token(type, undefined, p(ps, pe, this.textPart));
                }

            // if the previous symbol string was of some length, that means there's an unexpected character
            // throw error
            } else if (this.prevSymbolStr.length) {
                // back up by one before passing the position to the error
                this.prev();
                let hh: any = h(ERROR_UNEXP_CHAR, this.current.char!);
                let pp: any = p(this.current.pos.clone(), this.text);
                
                return new IllegalCharException(hh, pp);
            }

        }

        return;
    }

    protected stripComment = (end: any) => {
        // advance until found a matching comment end symbol or reached the end
        while (this.current.char && !isCommentEnd(this.text, this.current.pos.index, end)) {
            this.next(this.text);
        }

        // if the end symbol is a new line, don't strip it
        if (this.current.char == COMMENT_NEWLINE) return;
        // otherwise do
        for (let i = 0; i < end.length; i++) this.next(this.text);

        // back up by one
        this.prev(this.text);
    }

    protected next = (text: string =this.textPart!) => {
        this.current.pos.next(this.current.char);
        this.current.char = text[this.current.pos.index] || null;
    }

    protected prev = (text: string =this.textPart!) => {
        this.current.pos.prev();
        this.current.char = text[this.current.pos.index] || null;
    }

    protected rewind = (text: string =this.textPart!) => {
        this.current.pos = new Position(-1, 1, 0);
        this.current.char = null;
        this.current.symbolStr = "";
        this.next(text);
    }

}