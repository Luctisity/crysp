export type VarDict = {
    [key: string]: any
}

export default class VarStore {

    vars: VarDict = {};
    parent?: VarStore;

    get (name: string) {
        let targetValue = this.vars[name];

        if (!targetValue === undefined && this.parent) 
            targetValue = this.parent.get(name);

        return targetValue;
    }

    set (name: string, value: any) {
        this.vars[name] = value;
    }

    delete (name: string) {
        delete this.vars[name];
    }

}