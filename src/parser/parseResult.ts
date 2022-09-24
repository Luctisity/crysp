import { Exception } from "../classes/exception";
import { BaseNode } from "./nodes";

export default class ParseResult {

    err?:  Exception;
    node?: BaseNode;

    make (res: any) {
        if (res instanceof ParseResult) {
            if (res.err) this.err = res.err;
            return res.node;
        }

        return res;
    }

    success (node: BaseNode) {
        this.node = node;
        return this;
    }

    fail (err: Exception) {
        this.err = err;
        return this;
    }

}