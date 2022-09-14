import Lexer from './src/lexer/lexer';
import Token from './src/lexer/token';
import Parser from './src/parser/parser';
import Interpreter from './src/interpreter/interpreter';
import Context from './src/interpreter/context';
import VarStore from './src/interpreter/varStore';
import { CryspNumber } from './src/interpreter/builtins';
import { COMMAND_SEPARATE } from './src/lexer/constants';

const text = `let bruh = let man = 32; let bruh = bruh * 2;
bruh - 4;
let zero = null;
5 / zero;`;

function lexerize (t: string) {
    const lexer = new Lexer(t);
    let [tokens, error] = lexer.makeTokens();

    if (error) console.error(error.toString());
    else       console.log(tokens?.toString());

    return tokens;
}

function parse (t: string) {
    let tokens = lexerize(t);
    if (!tokens) return;

    const parser = new Parser(tokens as Token[], t);
    let ast = parser.parse();

    if (ast.exception) 
        console.error(ast.exception.toString());
    else {
        console.log(ast.node?.toString());
        return ast;
    }
}

const globalContext = new Context('global scope');
const globalVarStore = new VarStore();
globalVarStore.set("null", new CryspNumber(0));
globalContext.varStore = globalVarStore;

function interpret (t: string) {
    let ast = parse(t);
    if (!ast) return;

    const interpreter = new Interpreter(t);

    let result = interpreter.pass(ast.node!, globalContext);

    if (result.exception) console.error(result.exception.toString());
    else                  console.log(result.value.toString());
}

function divideCommands(t: string) {
    let rt: any = t;
    
    let sep, sepNext;
    for (let i = 0; i < COMMAND_SEPARATE.length; i++) {
        sep     = COMMAND_SEPARATE[i];
        sepNext = COMMAND_SEPARATE[i+1];

        rt = rt.split(sep).join(sepNext || sep);
    }

    rt = rt
        .split(sep)
        .filter(f => f);

    console.log(rt);
    return rt;
}

console.log(text);

divideCommands(text).forEach(command => {
    interpret(command);
    console.log(globalContext);
});