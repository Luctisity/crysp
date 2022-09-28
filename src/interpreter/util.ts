import { RuntimeException } from "../classes/exception";
import { TOKEN_FLOAT, TOKEN_IDENTIFIER, TOKEN_INT, TOKEN_KEYWORD, TOKEN_STRING } from "../lexer/constants";
import Token from "../lexer/token";
import BlockBreak, { BlockBreakType } from "./blockBreak";
import { BuiltinOrErr } from "./builtins";

export function isNumber (token: Token) {
    return token.type == TOKEN_INT || token.type == TOKEN_FLOAT;
}

export function isBoolean (token: Token) {
    return token.type == TOKEN_KEYWORD && (token.value == 'true' || token.value == 'false');
}

export function isString (token: Token) {
    return token.type == TOKEN_STRING;
}

export function isVariable (token: Token) {
    return token.type == TOKEN_IDENTIFIER;
}

export function getBooleanValue (token: Token) {
    return token.value == 'true';
}

export function matchKeyword (map: any, token: Token) {
    return token.type == TOKEN_KEYWORD ? map[token.value] : undefined;
}

export function isErr (h: BuiltinOrErr) {
    return h instanceof RuntimeException;
}

export function isBlockBreak (h: BuiltinOrErr, type?: BlockBreakType) {
    return h instanceof BlockBreak && (type !== undefined ? h.type == type : true);
}

export function repeatStr (s: string, n: number) {
    let ss = '';
    for (let i = 0; i < n; i++) ss += s;
    return ss;
}