export const ERROR_UNEXP_CHAR    = "Unexpected character: $";
export const ERROR_NUMERIC_IDNTF = "Identifier names cannot start with a numberic digit";
export const ERROR_UNCLOSED_STR  = "Expected a closing string quote before the end of line";
export const ERROR_UNEXP_TOKEN   = "Unexpected token: $";
export const ERROR_MEMACCESSDOT  = "Unexpected expression after the \".\" operator. Only identifiers are allowed.";

export const RTERROR_DIV_ZERO         = "Division by zero";
export const RTERROR_NOT_DEFINED      = "$ is not defined in this scope";
export const RTERROR_ALREADY_DECLARED = "$ has already been declared in this scope";
export const RTERROR_READ_PROPS_NULL  = "Cannot read properties of null (null[\"$\"])";
export const RTERROR_WRITE_PROPS_NULL = "Cannot write properties to null (null[\"$\"])";
export const RTERROR_NOT_A_FUNC       = "$ is not a function";
export const RTERROR_NOT_ENOUGH_ARGS  = "Too few arguments provided to function $";
export const RTERROR_ILLEGAL_BLOCK_BREAK = [
    "Cannot return outside of a function",
    "Cannot break outside of a loop or a switch case",
    "Cannot continue outside of a loop iteration"
];

export const BUILTIN_FUNCTION_NAME = "Function";
export const BUILTIN_FUNCTION_ANON = "anonymous";

export function h (str: string, repl: string) {
    return str.replaceAll("$", repl);
}