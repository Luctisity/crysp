import { PositionRange } from "./position";

export class Exception {

    details?: string;
    range?:   PositionRange;

    type = 'Exception';

    constructor (details?: string, range?: PositionRange) {
        this.details = details;
        this.range   = range;
    }

    protected constructErrorStr () {
        let s = 'Exception thrown';
        if (this.range) s += ` on line ${this.range.start.line} col ${this.range.start.col}`;
        s += `: ${this.type}`;

        if (this.details) s += `\n  > ${this.details}`;

        if (this.range) {
            const text = this.range.text?.split('\n')[this.range.start.line-1];
            s += `\n  > ${text}`;

            let underlStart = this.range.start.col-1;
            let underlEnd = this.range.end.col;
            if (this.range.start.line != this.range.end.line) underlEnd = text!.length;

            s += this.underline(4, underlStart, underlEnd)
        }

        return s;
    }

    protected underline(offset: number, from: number, to: number) {
        let s = '\n';
        let start = offset + from;

        for (let i = 0; i < start; i++)     s += ' ';
        for (let i = 0; i < to - from; i++) s += '‾';
        return s;
    }

    toString () {
        return this.constructErrorStr();
    }

}

export class IllegalCharException extends Exception {

    type = 'IllegalCharException';

}

export class SyntaxErrorException extends Exception {

    type = 'SyntaxError';

}