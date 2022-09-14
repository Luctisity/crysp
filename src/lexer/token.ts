import { Position, PositionRange } from "../classes/position";

export default class Token {

    type: string;
    value: any;
    range?: PositionRange;

    constructor (type: string, value?: any, start?: Position, end?: Position) {
        this.type = type;
        this.value = value;

        if (start) {
            this.range = new PositionRange(start.clone(), start.clone());
        }

        if (start && end) {
            this.range!.end = end.clone();
        }
    }

    toString () {
        return this.value ? `[Token:${this.type}:${JSON.stringify(this.value)}]` : `[Token:${this.type}]`;
    }

    sameAs (type: string, value: any) {
        return this.type == type && this.value == value;
    }

}