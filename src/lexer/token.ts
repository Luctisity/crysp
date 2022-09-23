export default class Token {

    type: string;
    value: any;

    constructor (type:string, value?:any) {
        this.type  = type;
        this.value = value;
    }

    toString () {
        if (this.value === undefined) return `(${this.type})`;
        return `(${this.type}:${JSON.stringify(this.value)})`;
    }

}