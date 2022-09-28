import { COMMENT_END, COMMENT_START, KEYWORDS, NUMERIC, NUMERIC_DOT, NUMERIC_EXP, STRING, STRING_ESCAPE_CODES, SYMBOLS, WORD } from "./constants";

export function isWhitespace (char: string) {
    return char.trim() != char;
}

export function isStringQuote (char: string) {
    return STRING.includes(char);
}

export function getStringEscapeCode (char: string) {
    return STRING_ESCAPE_CODES[char] || char;
}

export function isNumeric (char: string) {
    return NUMERIC.includes(char);
}

export function isDot (char: string) {
    return char == NUMERIC_DOT;
}

export function isExp (char: string) {
    return char == NUMERIC_EXP;
}

export function isFloatNumeric (char: string) {
    return isNumeric(char) || isDot(char);
}

export function isFloatNumericExp (char: string) {
    return isNumeric(char) || isDot(char) || isExp(char);
}

export function isWord (char: string) {
    return WORD.includes(char);
}

export function isKeyword (word: string) {
    return KEYWORDS.includes(word);
}

export function isSymbol (str: string) {
    return SYMBOLS[str];
}

export function hasSymbolsStartWith (str: string) {
    return Object.keys(SYMBOLS).filter(f => f.startsWith(str)).length;
}

export function isComment (text: string, pos: number) {
    let comment: boolean|string = false;

    let ci = -1;
    COMMENT_START.forEach(cs => {
        ci++;
        let s = text.slice(pos, pos+cs.length);
        if (s == cs) comment = COMMENT_END[ci];
    });

    return comment;
}

export function isCommentEnd (text: string, pos: number, end: string) {
    let s = text.slice(pos, pos+end.length);
    if (s == end) return true;
    return false;
}

