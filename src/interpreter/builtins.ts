import { RuntimeException } from "../classes/exception";
import { PositionRange } from "../classes/position";
import { RTERROR_DIV_ZERO } from "../strings";

export type BuiltinOrErr = Builtin | RuntimeException;

interface Builtin {

    value: any;

    add      (what: Builtin): Builtin;
    subtract (what: Builtin): Builtin;
    multiply (what: Builtin): Builtin;
    divide   (what: Builtin): BuiltinOrErr;
    power    (what: Builtin): Builtin;
    modulo   (what: Builtin): Builtin;

    equals    (what: Builtin): Builtin;
    notEquals (what: Builtin): Builtin;
    greater   (what: Builtin): Builtin;
    less      (what: Builtin): Builtin;
    greaterEq (what: Builtin): Builtin;
    lessEq    (what: Builtin): Builtin;

    and      (what: Builtin): Builtin;
    or       (what: Builtin): Builtin;

    numerify (): NumberBuiltin;
    negate   (): NumberBuiltin;
    castBool (): BooleanBuiltin;
    invert   (): BooleanBuiltin;

}

export class BaseBuiltin {

    value:  any;
    range?: PositionRange;

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }

    add (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value + what.numerify().value);
    }

    subtract (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value - what.numerify().value);
    }

    multiply (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value * what.numerify().value);
    }

    divide (what: Builtin): BuiltinOrErr {
        console.log(this.range);
        let divider = what.numerify().value;
        if (divider === 0) return new RuntimeException(RTERROR_DIV_ZERO, this.range);
        return new NumberBuiltin(this.numerify().value / divider);
    }

    power (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value ** what.numerify().value);
    }

    modulo (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value % what.numerify().value);
    }

    equals (what: Builtin): Builtin {
        // strict equality!!!
        return new BooleanBuiltin(this.value === what.value);
    }

    notEquals (what: Builtin): Builtin {
        // strict equality!!!
        return new BooleanBuiltin(this.value !== what.value);
    }

    greater (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value > what.value);
    }

    less (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value < what.value);
    }

    greaterEq (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value >= what.value);
    }

    lessEq (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value <= what.value);
    }

    and (what: Builtin): Builtin {
        if (!this.castBool().value) return this;
        else return what;
    }

    or (what: Builtin): Builtin {
        if (this.castBool().value) return this;
        else return what;
    }


    numerify (): NumberBuiltin {
        return new NumberBuiltin(0);
    }

    negate (): NumberBuiltin {
        return new NumberBuiltin(-this.numerify().value);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(false);
    }

    invert (): BooleanBuiltin {
        return new BooleanBuiltin(!this.castBool().value);
    }

}

export class NullBuiltin extends BaseBuiltin implements Builtin {

    value = null;

    numerify (): NumberBuiltin {
        return new NumberBuiltin(0);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(false);
    }

}

export class NumberBuiltin extends BaseBuiltin implements Builtin {

    value: number;

    constructor (value: number) {
        super();
        this.value = value;
    }

    numerify (): NumberBuiltin {
        return new NumberBuiltin(this.value);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(this.value != 0);
    }

}

export class BooleanBuiltin extends BaseBuiltin implements Builtin {

    value: boolean;

    constructor (value: boolean) {
        super();
        this.value = value;
    }

    numerify (): NumberBuiltin {
        return new NumberBuiltin(+this.value);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(this.value);
    }

}