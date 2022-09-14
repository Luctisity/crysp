export const TOKEN_INT   = 'INT';
export const TOKEN_FLOAT = 'FLOAT';

export const TOKEN_KEYWORD    = 'KEYWORD';
export const TOKEN_IDENTIFIER = 'IDENTIFIER';

export const TOKEN_ADD = 'ADD';
export const TOKEN_SUB = 'SUB';
export const TOKEN_MUL = 'MUL';
export const TOKEN_DIV = 'DIV';
export const TOKEN_POW = 'POW';

export const TOKEN_ASSIGN = 'ASSIGN';

export const TOKEN_OPAREN = 'OPAREN';
export const TOKEN_CPAREN = 'CPAREN';

export const TOKEN_END = 'END';

export const tokenMap: any = {
    '+': TOKEN_ADD,
    '-': TOKEN_SUB,
    '*': TOKEN_MUL,
    '/': TOKEN_DIV,
    '^': TOKEN_POW,
    '=': TOKEN_ASSIGN,
    '(': TOKEN_OPAREN,
    ')': TOKEN_CPAREN,
}