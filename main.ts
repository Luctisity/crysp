import { Exception } from './src/classes/exception';
import Lexer from './src/lexer/lexer';
import Parser from './src/parser/parser';

const text = `
try { 
    69 + 
    42; 
    420;

    delete 54; 
} catch { 
    42 + 42; 
}
return 5 == 3 * 2;`;
console.log(text);

function run () {

    const lexer = new Lexer(text);
    let result = lexer.tokenize();

    if (result instanceof Exception) return console.error(result.toString());
    else console.log(result.toString());

    const parser = new Parser(result);
    result = parser.parse();

    if (result instanceof Exception) return console.error(result.toString());
    else console.log(result.toString());
    console.log(result);

}

run();