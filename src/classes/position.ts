import { isNewLine } from "../util/util";

export class Position {

    idx: number; line: number; col: number;

    constructor (idx: number, line: number, col: number) {
        this.idx  = idx;
        this.line = line;
        this.col  = col;
    }

    next (char: string | null) {
        this.idx++;
        this.col++;

        if (char && isNewLine(char)) {
            this.line++;
            this.col = 0;
        }
    }

    prev () {
        this.idx--;
        this.col--;
        return this;
    }

    clone () {
        return new Position(this.idx, this.line, this.col);
    }

    sameAs (p: Position) {
        return p.idx == this.idx && p.line == this.line && p.col == this.col;
    }

}

export class PositionRange {

    start: Position;
    end: Position;

    constructor (start: Position, end?: Position) {
        this.start = start;
        this.end   = end || start;
    }

    clone () {
        return new PositionRange(this.start.clone(), this.end.clone());
    }

    plusOne () {
        this.start.next(null);
        this.end.next(null);
        return this;
    }

}