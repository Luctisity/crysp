import { RuntimeException } from "../classes/exception";
import { PositionRange } from "../classes/position";
import Token from "../lexer/token";
import { BaseNode } from "../parser/nodes";
import { BUILTIN_VALUE_ANON, BUILTIN_FUNCTION_NAME, h, RTERROR_DIV_ZERO, RTERROR_READ_PROPS_NULL, BUILTIN_DICTIONARY_NAME } from "../strings";
import BlockBreak from "./blockBreak";
import Context from "./context";
import { builtinOrToken, repeatStr } from "./util";

export type BuiltinOrErr = Builtin | RuntimeException | BlockBreak;
export type DictionaryBuiltinValue = { [key: string]: BaseBuiltin }

interface Builtin {

    value: any;
    name: string;
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

    member    (what: Builtin|Token): BuiltinOrErr;
    setMember (what: Builtin|Token, value: Builtin): BuiltinOrErr;
    deleteMember (_what: Builtin|Token): void;

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
    name   =  BUILTIN_VALUE_ANON;
    isFunc =  false;
    range?:   PositionRange;
    context?: Context;
    parent?:  BaseBuiltin;

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }

    setContext (context?: Context) {
        this.context = context;
        return this;
    }

    setParent (parent?: BaseBuiltin) {
        this.parent = parent;
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
        // if exactly one of the sides is string, subtract number from the string's length
        // otherwise, multiply as numbers
        if (this instanceof StringBuiltin && !(what instanceof StringBuiltin))
            return new StringBuiltin(
                this.value.slice(0, -Math.round(what.numerify().value) || this.value.length)
            ).setContext(this.context);

        return new NumberBuiltin(this.numerify().value - what.numerify().value).setContext(this.context);
    }

    increment (): Builtin {
        return new NumberBuiltin(this.numerify().value + 1).setContext(this.context);
    }

    decrement (): Builtin {
        return new NumberBuiltin(this.numerify().value - 1).setContext(this.context);
    }

    multiply (what: Builtin): Builtin {
        // if exactly one of the sides is string, repeat string number of times
        // otherwise, multiply as numbers
        if (this instanceof StringBuiltin && !(what instanceof StringBuiltin))
            return new StringBuiltin(repeatStr(this.value, what.numerify().value)).setContext(this.context);
        if (what instanceof StringBuiltin && !(this instanceof StringBuiltin))
            return new StringBuiltin(repeatStr(what.value, this.numerify().value)).setContext(this.context);

        return new NumberBuiltin(this.numerify().value * what.numerify().value).setContext(this.context);
    }

    divide (what: Builtin): BuiltinOrErr {
        let divider = what.numerify().value;
        if (divider === 0) return new RuntimeException(RTERROR_DIV_ZERO, this.range, this.context);

        // if exactly one of the sides is string, divide string's length by number
        // otherwise, multiply as numbers
        if (this instanceof StringBuiltin && !(what instanceof StringBuiltin))
            return new StringBuiltin(
                this.value.slice(0, Math.round(this.value.length / divider))
            ).setContext(this.context);

        return new NumberBuiltin(this.numerify().value / divider).setContext(this.context);
    }

    power (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value ** what.numerify().value).setContext(this.context);
    }

    modulo (what: Builtin): Builtin {
        return new NumberBuiltin(this.numerify().value % what.numerify().value).setContext(this.context);
    }

    member (_what: Builtin|Token): BuiltinOrErr {
        return new NullBuiltin().setParent(this);
    }

    setMember (_what: Builtin|Token, _value: Builtin): BuiltinOrErr {
        return new NullBuiltin().setParent(this);
    }

    deleteMember (_what: Builtin|Token): void {}

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

    member (what: Builtin|Token): BuiltinOrErr {
        return new RuntimeException(h(RTERROR_READ_PROPS_NULL, builtinOrToken(what)), this.range, this.context);
    }

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

    value:  BaseNode;
    params: string[] = [];
    isFunc = true;
    oneLiner = false;

    constructor (value: BaseNode, name?: string, params?: string[], oneLiner: boolean = false) {
        super();
        this.value = value;
        this.name  = name || BUILTIN_VALUE_ANON;
        this.params = params || this.params;
        this.oneLiner = oneLiner;
    }

    numerify (): NumberBuiltin {
        return new NumberBuiltin(1).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(true).setContext(this.context);
    }

    castStr (): StringBuiltin {
        return new StringBuiltin(`[${BUILTIN_FUNCTION_NAME}:${this.name}]`);
    }

}

export class DictionaryBuiltin extends BaseBuiltin implements Builtin {

    value: DictionaryBuiltinValue = Object.create(null);

    constructor (value?: DictionaryBuiltinValue) {
        super();
        this.value = value || this.value;
    }

    member (what: Builtin|Token): BuiltinOrErr {
        const keyStr = (what instanceof Token) ? what.value.toString() : what.castStr();
        return this.value[keyStr] || new NullBuiltin().setParent(this);
    }

    setMember (what: Builtin|Token, value: BaseBuiltin): BuiltinOrErr {
        const keyStr = (what instanceof Token) ? what.value.toString() : what.castStr();
        this.value[keyStr] = value.setParent(this);
        return value;
    }

    deleteMember (what: Builtin|Token): void {
        const keyStr = (what instanceof Token) ? what.value.toString() : what.castStr();
        delete this.value[keyStr];
    }

    numerify (): NumberBuiltin {
        return new NumberBuiltin(1).setContext(this.context);
    }

    castBool (): BooleanBuiltin {
        return new BooleanBuiltin(true).setContext(this.context);
    }

    castStr (): StringBuiltin {
        return new StringBuiltin(`[${BUILTIN_DICTIONARY_NAME}:${this.name}]`);
    }

}