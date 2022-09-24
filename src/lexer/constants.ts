export const TOKEN_STRING = 'STRING';
export const TOKEN_INT    = 'INT';
export const TOKEN_FLOAT  = 'FLOAT';

export const TOKEN_KEYWORD    = 'KEYWORD';
export const TOKEN_IDENTIFIER = 'IDENTIFIER';

export const TOKEN_AND = 'AND';
export const TOKEN_OR  = 'OR';
export const TOKEN_NOT = 'NOT';

export const TOKEN_EQUALS    = 'EQUALS';
export const TOKEN_NOTEQ     = 'NOTEQ';
export const TOKEN_GREATER   = 'GREATER';
export const TOKEN_LESS      = 'LESS';
export const TOKEN_GREATEREQ = 'GREATEREQ';
export const TOKEN_LESSEQ    = 'LESSEQ';

export const TOKEN_ASSIGN  = 'ASSIGN';
export const TOKEN_ADDTO   = 'ADDTO';
export const TOKEN_SUBFROM = 'SUBFROM';
export const TOKEN_MULBY   = 'MULBY';
export const TOKEN_DIVBY   = 'DIVBY';
export const TOKEN_POWERBY = 'POWERBY';
export const TOKEN_MODBY   = 'MODBY';
export const TOKEN_INCR    = 'INCR';
export const TOKEN_DECR    = 'DECR';

export const TOKEN_ADD = 'ADD';
export const TOKEN_SUB = 'SUB';
export const TOKEN_MUL = 'MUL';
export const TOKEN_DIV = 'DIV';
export const TOKEN_POW = 'POW';
export const TOKEN_MOD = 'MOD';

export const TOKEN_SEP      = 'SEP';
export const TOKEN_DOT      = 'DOT';
export const TOKEN_COLON    = 'COLON';
export const TOKEN_BLOCKSEP = 'BLOCKSEP';
export const TOKEN_NEWL     = 'NEWL';

export const TOKEN_OPAREN = 'OPAREN';
export const TOKEN_CPAREN = 'CPAREN';
export const TOKEN_OBRACK = 'OBRACK';
export const TOKEN_CBRACK = 'CBRACK';
export const TOKEN_OCURLY = 'OCURLY';
export const TOKEN_CCURLY = 'CCURLY';

export const NUMERIC       = '1234567890';
export const NUMERIC_DOT   = '.';
export const NUMERIC_EXP   = 'e';
export const STRING        = '"\'';
export const WORD          = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_1234567890$';

export const KEYWORDS = [
    'and', 'or', 'not', 'is',
    'let', 'func', 'const', 'enum', 'event',
    'true', 'false', 'null',
    'if', 'else', 'switch', 'case', 'default',
    'while', 'do', 'for', 'in', 'try', 'catch',
    'return', 'break', 'continue', 'throw', 'delete',
    'class', 'new', 'super', 'self', 'get', 'set'
];

export const SYMBOLS: any = {
    '&&':  TOKEN_AND,
    '||':  TOKEN_OR,
    '!':   TOKEN_NOT,

    '==':  TOKEN_EQUALS,
    '!=':  TOKEN_NOTEQ,
    '>':   TOKEN_GREATER,
    '<':   TOKEN_LESS,
    '>=':  TOKEN_GREATEREQ,
    '<=':  TOKEN_LESSEQ,

    '+=':  TOKEN_ADDTO,
    '-=':  TOKEN_SUBFROM,
    '*=':  TOKEN_MULBY,
    '/=':  TOKEN_DIVBY,
    '^=':  TOKEN_POWERBY,
    '%=':  TOKEN_MODBY,
    '++':  TOKEN_INCR,
    '--':  TOKEN_DECR,
    '=':   TOKEN_ASSIGN,

    '+':   TOKEN_ADD,
    '-':   TOKEN_SUB,
    '*':   TOKEN_MUL,
    '/':   TOKEN_DIV,
    '^':   TOKEN_POW,
    '%':   TOKEN_MOD,

    ',':   TOKEN_SEP,
    '.':   TOKEN_DOT,
    ':':   TOKEN_COLON,
    ';':   TOKEN_BLOCKSEP,
    '\n':  TOKEN_NEWL,

    '(':   TOKEN_OPAREN,
    ')':   TOKEN_CPAREN,
    '[':   TOKEN_OBRACK,
    ']':   TOKEN_CBRACK,
    '{':   TOKEN_OCURLY,
    '}':   TOKEN_CCURLY,
}

export const STRING_ESCAPE_CODES: any = {
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'v': '\v'
}

export const COMMENT_START     = ["//", "/*"];
export const COMMENT_END       = ["\n", "*/"];
export const COMMENT_NEWLINE   = '\n';