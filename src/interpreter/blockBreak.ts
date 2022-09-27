import { PositionRange } from "../classes/position";
import { BaseBuiltin, NullBuiltin } from "./builtins";
import Context from "./context";

export enum BlockBreakType { FUNCTION, LOOP, ITERATION }

export default class BlockBreak {

    type: BlockBreakType;
    value: BaseBuiltin = new NullBuiltin();

    range?:   PositionRange;
    context?: Context;

    constructor (type: BlockBreakType, value?: BaseBuiltin) {
        this.type = type;
        this.value = value || this.value;
    }

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }

    setContext (context?: Context) {
        this.context = context;
        return this;
    }

}