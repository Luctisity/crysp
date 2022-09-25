import Context from "../interpreter/context";
import { PositionRange } from "./position";

export class Exception {

    details?: string;
    range?:   PositionRange;
    context?: Context;

    type = 'Exception';

    constructor (details?: string, range?: PositionRange, context?: Context) {
        this.details = details;
        this.range   = range;
        this.context = context;
        
        if (this.range && this.range.start.col < 1) {
            this.range.start.next();
            this.range.end.next();
        }
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

        if (this.context) s += this.traceback();

        return s;
    }

    protected underline (offset: number, from: number, to: number) {
        let s = '\n';
        let start = offset + from;

        for (let i = 0; i < start; i++)     s += ' ';
        for (let i = 0; i < to - from; i++) s += '‾';
        return s;
    }

    protected traceback () {
        let s = '';
        let pos   = this.range?.start;
        let ctx   = this.context?.lastFunction();

        while (ctx) {
            s = `\nat ${ctx.name} (${pos ? pos.line : 1}:${pos ? pos.col : 1})` + s;
            pos = ctx.parentEntryPos;
            ctx = ctx.parent?.lastFunction();
        }

        return s;
    }

    toString () {
        return this.constructErrorStr();
    }

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }

}

export class IllegalCharException extends Exception {

    type = 'IllegalCharException';

}

export class SyntaxErrorException extends Exception {

    type = 'SyntaxError';

}

export class RuntimeException extends Exception {

    type = 'RuntimeException';

}