import Context from "../interpreter/context";
import { Position, PositionRange } from "./position";

export class Exception {

    name: string;
    details: string;
    description: string = '';
    range: PositionRange;
    text?: string;
    context?: Context;

    constructor (name: string, range: PositionRange, details: string, description?: string, text?: string, context?: Context) {
        this.name    = name;
        this.range   = range;
        this.details = details;
        if (description) this.description = description;
        this.text = text;
        this.context = context;
    }

    // a string representation of the error
    toString () {
        let ps = this.range.start;
        let pe = this.range.end;

        let ptxt = '';
        if (ps.sameAs(pe)) ptxt += `on ln ${ps.line}, col ${ps.col}`;
        else               ptxt += `from ln ${ps.line}, col ${ps.col} to ln ${pe.line}, col ${pe.col}`;

        return `Exception thrown ${ptxt}: ${this.name}\n    > ${this.description ? this.description + ': ' : ''}${this.details}${this.generateHighlightLineStr()}${this.generateTraceStr()}`;
    }

    // generate a string with the problematic line and underlined problematic columns
    // example:
    // > 6 5 * 5 * 2
    //     ‾
    private generateHighlightLineStr () {
        let txt = '';
        if (this.text) {
            txt = '\n    > ';
            let btxt = '\n     ';
            let targetLine = this.text.split('\n')[this.range.start.line-1];
            txt += targetLine;

            let snippetLength = 0;
            if (this.range.start.line == this.range.end.line) 
                snippetLength = this.range.end.col - this.range.start.col + 1;
            else
                snippetLength = targetLine.length - this.range.start.col + 1;

            let snippetOffset = this.range.start.col;

            for (let i = 0; i < snippetOffset; i++) btxt += ' ';
            for (let i = 0; i < snippetLength; i++) btxt += '‾';

            txt += btxt;
        }
        return txt;
    }

    // generate a trace of scopes going from the error
    private generateTraceStr () {
        let txt = '';

        if (this.context) {     
            let ctx: Context  | undefined = this.context;
            let pos: Position | undefined = this.range.start;
            while (ctx) {
                txt += `\nat ${ctx.name} (${pos?.line}:${pos?.col})`;
                pos = ctx.parentEntryPos;
                ctx = ctx.parent;
            }
        }

        return txt;
    }

}

export class IllegalCharacterException extends Exception {

    constructor (range: PositionRange, details: string, text?: string, context?: Context) {
        super("IllegalCharacterException", range, details, 'Unrecognized character', text, context);
    }

}

export class InvalidSyntaxException extends Exception {

    constructor (range: PositionRange, details: string, text?: string, context?: Context) {
        super("InvalidSyntaxException", range, details, 'Cannot parse expression', text, context);
    }

}

export class RuntimeException extends Exception {

    constructor (range: PositionRange, details: string, text?: string, context?: Context) {
        super("RuntimeException", range, details, 'Unexpected behaviour', text, context);
    }

}