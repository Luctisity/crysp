import { PositionRange } from "../classes/position";

export default class Token {

    type: string;
    value: any;
    range?: PositionRange;

    constructor (type:string, value?:any, range?: PositionRange) {
        this.type  = type;
        this.value = value;
        this.range = range;
    }

    toString () {
        if (this.value === undefined) return `(${this.type})`;
        return `(${this.type}:${JSON.stringify(this.value)})`;
    }

}