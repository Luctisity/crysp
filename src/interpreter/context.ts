import Position from "../classes/position";
import VarStore from "./varStore";

export default class Context {

    name: string;
    parent?: Context;
    parentEntryPos?: Position;
    varStore?: VarStore;

    isFunction = true;
    isLoop     = false;

    constructor (name: string, parent?: Context, parentEntryPos?: Position, isFunction: boolean = true, isLoop: boolean = false) {
        this.name = name;
        this.parent = parent;
        this.parentEntryPos = parentEntryPos;
        this.isFunction = isFunction;
        this.isLoop = isLoop;
    }

    lastFunction (): Context {
        if (this.isFunction || !this.parent) return this;
        return this.parent.lastFunction();
    }

    isInsideALoop (): boolean {
        if (this.isLoop)  return true;
        if (!this.parent) return false;
        return this.parent.isInsideALoop();
    }

    isInsideAFunc (): boolean {
        if (!this.parent)     return false;
        if (this.isFunction)  return true;
        return this.parent.isInsideAFunc();
    }

    setVarStore (vs?: VarStore) {
        this.varStore = vs;
        return this;
    }

}