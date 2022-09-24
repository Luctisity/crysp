import { RuntimeException } from "../classes/exception";
import { TOKEN_FLOAT, TOKEN_INT, TOKEN_KEYWORD } from "../lexer/constants";
import Token from "../lexer/token";
import { BuiltinOrErr } from "./builtins";

export function isNumber (token: Token) {
    return token.type == TOKEN_INT || token.type == TOKEN_FLOAT;
}

export function isBoolean (token: Token) {
    return token.type == TOKEN_KEYWORD && (token.value == 'true' || token.value == 'false');
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