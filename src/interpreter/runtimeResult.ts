import { Exception } from "../classes/exceptions";

export default class RuntimeResult {

    value:     any       | null = null;
    exception: Exception | null = null;
    text?:     string;

    constructor (text?: string) {
        this.text = text;
    }

    register (result: any) {
        if (result.exception) this.exception = result.exception;
        return result.value;
    }

    success (value: any) {
        this.value = value;
        return this;
    }

    fail (exception: Exception) {
        this.exception = exception;
        exception.text = this.text;
        return this;
    }

}