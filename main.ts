import { Exception } from './src/classes/exception';
import Lexer from './src/lexer/lexer';
import Parser from './src/parser/parser';

const text = `
do {
    "Hello"; "Hi";
    true * 3
} while (6 == 7);
return 6;`;
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