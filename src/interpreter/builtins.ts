import { Exception, RuntimeException } from "../classes/exceptions";
import { PositionRange } from "../classes/position";
import Context from "./context";

export type CryspNumberAndError = [CryspNumber | null, Exception | null];

export class CryspNumber {

    value:  number;
    range?: PositionRange;
    context?: Context;

    constructor (value: number) {
        this.value = value;
    }

    clone () {
        return new CryspNumber(this.value)
            .setPosition(this.range)
            .setContext(this.context);
    }

    setPosition (range?: PositionRange) {
        this.range = range;
        return this;
    }

    setContext (context?: Context) {
        this.context = context;
        return this;
    }

    construct (val: number) {
        let r: CryspNumberAndError = [new CryspNumber(val).setContext(this.context), null]
        return r;
    }

    add (number: CryspNumber) {
        let r: CryspNumberAndError = this.construct(this.value + number.value);
        return r;
    }

    subtract (number: CryspNumber) {
        let r: CryspNumberAndError = this.construct(this.value - number.value);
        return r;
    }

    multiply (number: CryspNumber) {
        let r: CryspNumberAndError = this.construct(this.value * number.value);
        return r;
    }

    divide (number: CryspNumber) {
        let r: CryspNumberAndError;

        if (number.value == 0) r = [null, new RuntimeException(number.range!, "Attempted Division by Zero", "", this.context)];
        else r = this.construct(this.value / number.value);

        return r;
    }

    power (number: CryspNumber) {
        let r: CryspNumberAndError = this.construct(this.value ** number.value);
        return r;
    }

    toString () {
        return `[Number:${this.value}]`;
    }

}