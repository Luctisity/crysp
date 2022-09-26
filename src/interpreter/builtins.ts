import { RuntimeException } from "../classes/exception";
import { PositionRange } from "../classes/position";
import { BaseNode } from "../parser/nodes";
import { RTERROR_DIV_ZERO } from "../strings";
import Context from "./context";

export type BuiltinOrErr = Builtin | RuntimeException;

interface Builtin {

    value: any;
    isFunc: boolean;

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
    castStr  (): StringBuiltin;

}

export class BaseBuiltin {

    value:    any;
    isFunc =  false;
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
        // if at least one of the sides is string, concatinate strings
        // otherwise, add as numbers
        if (this instanceof StringBuiltin || what instanceof StringBuiltin)
            return new StringBuiltin(this.castStr().value + what.castStr().value).setContext(this.context);

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

    castStr (): StringBuiltin {
        return new StringBuiltin("");
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

    castStr (): StringBuiltin {
        return new StringBuiltin("null");
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

    castStr (): StringBuiltin {
        return new StringBuiltin(this.value.toString());
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

    castStr (): StringBuiltin {
        return new StringBuiltin(this.value ? "true" : "false");
    }

}

export class StringBuiltin extends BaseBuiltin implements Builtin {

    value: string;

    constructor (value: string) {
        super();
        this.value = value;
    }

    numerify (): NumberBuiltin {
        // if string is empty returns 0, otherwise 1
        return new NumberBuiltin(Math.min(this.value.length, 1)).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        // if string is empty return false, otherwise true
        return new BooleanBuiltin(this.value != "").setContext(this.context);
    }

    castStr (): StringBuiltin {
        return new StringBuiltin(this.value);
    }

}

export class FuncBuiltin extends BaseBuiltin implements Builtin {

    value: BaseNode;
    name:  string;
    isFunc = true;

    constructor (value: BaseNode, name?: string) {
        super();
        this.value = value;
        this.name  = name || "anonymous";
    }

    numerify (): NumberBuiltin {
        return new NumberBuiltin(1).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(true).setContext(this.context);
    }

    castStr (): StringBuiltin {
        return new StringBuiltin(`[Function:${this.name}]`);
    }

}