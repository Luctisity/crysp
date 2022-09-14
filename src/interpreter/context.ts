import { Position } from "../classes/position";
import VarStore from "./varStore";

export default class Context {

    name: string;
    parent?: Context;
    parentEntryPos?: Position;
    varStore?: VarStore;

    constructor (name: string, parent?: Context, parentEntryPos?: Position) {
        this.name = name;
        this.parent = parent;
        this.parentEntryPos = parentEntryPos;
    }

}