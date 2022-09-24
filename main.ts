import { Exception } from './src/classes/exception';
import Lexer from './src/lexer/lexer';
import Parser from './src/parser/parser';

const text = `
switch (5) {
    case 4:
        69
        a
    case 5:
        420
    case 8:
        69;
        42;
    default:
        69420;
}`;
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