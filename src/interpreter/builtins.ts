import { RuntimeException } from "../classes/exception";
import { PositionRange } from "../classes/position";
import { RTERROR_DIV_ZERO } from "../strings";
import Context from "./context";

export type BuiltinOrErr = Builtin | RuntimeException;

interface Builtin {

    value: any;

    set       (what: BaseBuiltin): BaseBuiltin;
    increment (): Builtin;
    decrement (): Builtin;
    add       (what: Builtin): Builtin;
    subtract  (what: Builtin): Builtin;
    multiply  (what: Builtin): Builtin;
    divide    (what: Builtin): BuiltinOrErr;
    power     (what: Builtin): Builtin;
    modulo    (what: Builtin): Builtin;

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

    value:    any;
    range?:   PositionRange;
    context?: Context;

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }

    setContext (context?: Context) {
        this.context = context;
        return this;
    }

    set (what: BaseBuiltin): BaseBuiltin {
        return what.setContext(this.context);
    }

    add (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value + what.numerify().value).setContext(this.context);
    }

    subtract (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value - what.numerify().value).setContext(this.context);
    }

    increment (): Builtin {
        return new NumberBuiltin(this.numerify().value + 1).setContext(this.context);
    }

    decrement (): Builtin {
        return new NumberBuiltin(this.numerify().value - 1).setContext(this.context);
    }

    multiply (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value * what.numerify().value).setContext(this.context);
    }

    divide (what: Builtin): BuiltinOrErr {
        let divider = what.numerify().value;
        if (divider === 0) return new RuntimeException(RTERROR_DIV_ZERO, this.range, this.context);
        return new NumberBuiltin(this.numerify().value / divider).setContext(this.context);
    }

    power (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value ** what.numerify().value).setContext(this.context);
    }

    modulo (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value % what.numerify().value).setContext(this.context);
    }

    equals (what: Builtin): Builtin {
        // strict equality!!!
        return new BooleanBuiltin(this.value === what.value).setContext(this.context);
    }

    notEquals (what: Builtin): Builtin {
        // strict equality!!!
        return new BooleanBuiltin(this.value !== what.value).setContext(this.context);
    }

    greater (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value > what.value).setContext(this.context);
    }

    less (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value < what.value).setContext(this.context);
    }

    greaterEq (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value >= what.value).setContext(this.context);
    }

    lessEq (what: Builtin): Builtin {
        return new BooleanBuiltin(this.value <= what.value).setContext(this.context);
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
        return new NumberBuiltin(0).setContext(this.context);
    }

    negate (): NumberBuiltin {
        return new NumberBuiltin(-this.numerify().value).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(false).setContext(this.context);
    }

    invert (): BooleanBuiltin {
        return new BooleanBuiltin(!this.castBool().value).setContext(this.context);
    }

}

export class NullBuiltin extends BaseBuiltin implements Builtin {

    value = null;

    numerify (): NumberBuiltin {
        return new NumberBuiltin(0).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(false).setContext(this.context);
    }

}

export class NumberBuiltin extends BaseBuiltin implements Builtin {

    value: number;

    constructor (value: number) {
        super();
        this.value = value;
    }

    numerify (): NumberBuiltin {
        return new NumberBuiltin(this.value).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(this.value != 0).setContext(this.context);
    }

}

export class BooleanBuiltin extends BaseBuiltin implements Builtin {

    value: boolean;

    constructor (value: boolean) {
        super();
        this.value = value;
    }

    numerify (): NumberBuiltin {
        return new NumberBuiltin(+this.value).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(this.value).setContext(this.context);
    }

}