import { Exception } from './src/classes/exception';
import Lexer from './src/lexer/lexer';
import Parser from './src/parser/parser';
import Interpreter from './src/interpreter/interpreter';

const text = `
if (true) {
    true is true;
} else 420;

/*
switch (5) {
    case 4:
        69
        - -69
    case 5:
        420
    case 6:
    case 8:
        69;
        42;
    default:
        69420;
}

if (5 == true) 5; 
else if (6) 6;
else 7;

4200000.1;*/`;
console.log(text);

function run () {

    const lexer = new Lexer(text);
    let [lexerResult, textPart] = lexer.tokenize();

    if (lexerResult instanceof Exception) return console.error(lexerResult.toString());
    else console.log(lexerResult.toString());

    const parser = new Parser(lexerResult, textPart);
    let parseResult = parser.parse();

    if (parseResult instanceof Exception) return console.error(parseResult.toString());
    else console.log(parseResult.toString());
    console.log(parseResult);

    const interpreter = new Interpreter();
    console.log(interpreter.interpret(parseResult));

}

run();