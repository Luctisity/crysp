import { KEYWORDS, NUMERIC, NUMERIC_DOT, WORD } from "../lexer/constants";

export function isWhitespace (char: string) {
    return !char.trim().length;
}

export function isNewLine (char: string) {
    return char == '\n';
}

export function isNumeric (char: string) {
    return NUMERIC.includes(char);
}

export function isDot (char: string) {
    return char == NUMERIC_DOT;
}

export function isNumericFloat (char: string) {
    return isNumeric(char) || isDot(char);
}

export function isWord (char: string) {
    return WORD.includes(char);
}

export function isKeyword (word: string) {
    return KEYWORDS.includes(word);
}