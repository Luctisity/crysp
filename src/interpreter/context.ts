import Position from "../classes/position";
import VarStore from "./varStore";

export default class Context {

    name: string;
    parent?: Context;
    parentEntryPos?: Position;
    varStore?: VarStore;

    isFunction = true;

    constructor (name: string, parent?: Context, parentEntryPos?: Position, isFunction: boolean = true) {
        this.name = name;
        this.parent = parent;
        this.parentEntryPos = parentEntryPos;
        this.isFunction = isFunction;
    }

    lastFunction (): Context {
        if (this.isFunction || !this.parent) return this;
        return this.parent.lastFunction();
    }

    setVarStore (vs?: VarStore) {
        this.varStore = vs;
        return this;
    }

}