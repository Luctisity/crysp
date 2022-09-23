export const ERROR_UNEXP_CHAR    = "Unexpected character: $";
export const ERROR_NUMERIC_IDNTF = "Identifier names cannot start with a numberic digit";
export const ERROR_UNCLOSED_STR  = "Expected a closing string quote before the end of statement";
export const ERROR_UNEXP_TOKEN   = "Unexpected token: $";

export function h (str: string, repl: string) {
    return str.replaceAll("$", repl);
}