import { Exception } from "../classes/exceptions";
import { NodeBase } from "./nodes";

export default class ParseResult {

    exception: Exception | null = null;
    node:      NodeBase  | null = null;

    // register a node/token or another parseresult and evaluate error
    register (result: ParseResult | any) {
        if (result instanceof ParseResult) {
            this.exception = result.exception || this.exception;
            return result.node;
        }

        return result;
    }

    success (node: NodeBase) {
        this.node = node;
        return this;
    }

    fail (exception: Exception) {
        this.exception = exception;
        return this;
    }

}