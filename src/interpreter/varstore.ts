import { BaseBuiltin } from "./builtins";

export type VarDict = {
    [key: string]: BaseBuiltin
}

export default class VarStore {

    vars: VarDict = Object.create(null);
    parent?: VarStore;

    constructor (parent?: VarStore) {
        this.parent = parent;
    }

    get (name: string) {
        let targetValue = this.vars[name];

        if (!targetValue && this.parent) 
            targetValue = this.parent.get(name);

        return targetValue;
    }

    set (name: string, value: BaseBuiltin) {
        value.name = name;
        this.vars[name] = value;
    }

    update (name: string, value: BaseBuiltin) {
        let target: VarStore = this;

        if (!target.vars[name] && this.parent) 
            target = this.parent.update(name, value);

        target.vars[name] = value;

        return target;
    }

    delete (name: string) {
        delete this.vars[name];
    }

    hasHere (name: string) {
        return !!this.vars[name];
    }

}