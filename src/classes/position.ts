export default class Position {

    index: number;
    line:  number;
    col:   number;

    constructor (index: number, line: number, col: number) {
        this.index = index;
        this.line  = line;
        this.col   = col;
    }

    next (currentChar?: string|null) {
        this.index++;
        this.col++;

        if (currentChar == '\n') {
            this.col = 1;
            this.line++;
        }

        return this;
    }

    prev () {
        this.index--;
        this.col--;

        return this;
    }

    rewindBy (n: number) {
        this.index -= n;
        this.col -= n;
        return this;
    }

    clone () {
        return new Position(this.index, this.line, this.col);
    }

}

export class PositionRange {

    start: Position;
    end:   Position;
    text?: string;

    constructor (start: Position, end?: Position, text?: string) {
        this.start = start;
        this.end   = end || start;
        this.text  = text;
    }

    clone () {
        return new PositionRange(
            new Position(this.start.index, this.start.line, this.start.col),
            new Position(this.end.index,   this.end.line,   this.end.col),
            this.text
        );
    }

}

export function p (ps: Position, pe?: Position | string, txt?: string) {
    if (typeof pe == 'string') return new PositionRange(ps, undefined, pe);
    return new PositionRange(ps, pe, txt);
}