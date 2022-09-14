import { RuntimeException } from "../classes/exceptions";
import { TOKEN_ADD, TOKEN_DIV, TOKEN_MUL, TOKEN_POW, TOKEN_SUB } from "../lexer/tokenTypes";
import { NodeAssignment, NodeBase, NodeBinaryOp, NodeNumeric, NodeUnaryOp, NodeVariable } from "../parser/nodes";
import { CryspNumber } from "./builtins";
import Context from "./context";
import RuntimeResult from "./runtimeResult";

export default class Interpreter {

    text?: string;

    constructor (text?: string) {
        this.text = text;
    }

    pass (node: NodeBase, context: Context) {
             if (node instanceof NodeNumeric)    return this.passNumeric   (node, context);
        else if (node instanceof NodeVariable)   return this.passVariable  (node, context);
        else if (node instanceof NodeAssignment) return this.passAssignment(node, context);
        else if (node instanceof NodeBinaryOp)   return this.passBinaryOp  (node, context);
        else if (node instanceof NodeUnaryOp)    return this.passUnaryOp   (node, context);
        return new RuntimeResult().success(new CryspNumber(0));
    }

    passNumeric (node: NodeNumeric, context: Context) {
        return new RuntimeResult().success(
            new CryspNumber(node.token.value).setContext(context).setPosition(node.range)
        );
    }

    passVariable (node: NodeVariable, context: Context) {
        let result = new RuntimeResult(this.text);

        let varName = node.varName.value;
        let value = context.varStore?.get(varName);

        if (value === undefined) {
            result.fail(new RuntimeException(
                node.range!, `Identifier ${varName} is not defined`, this.text, context
            ));
        }

        value = value.clone().setPosition(node.range!);
        return result.success(value);
    }

    passAssignment (node: NodeAssignment, context: Context) {
        let result = new RuntimeResult(this.text);

        let varName = node.varName.value;
        let value = result.register(this.pass(node.varValue, context));

        if (result.exception) return result;

        context.varStore?.set(varName, value);
        return result.success(value);
    }

    passBinaryOp (node: NodeBinaryOp, context: Context) {
        let result = new RuntimeResult(this.text);

        let leftNum: CryspNumber  = result.register(this.pass(node.leftNode, context));
        if (result.exception) return result;

        let rightNum: CryspNumber = result.register(this.pass(node.rightNode, context));

        let resultNum: CryspNumber | null = leftNum;
        let error: any;

        switch (node.operator.type) {
            case TOKEN_ADD:
                [resultNum, error] = leftNum.add(rightNum);
                break;
            case TOKEN_SUB:
                [resultNum, error] = leftNum.subtract(rightNum);
                break;
            case TOKEN_MUL:
                [resultNum, error] = leftNum.multiply(rightNum);
                break;
            case TOKEN_DIV:
                [resultNum, error] = leftNum.divide(rightNum);
                break;
            case TOKEN_POW:
                [resultNum, error] = leftNum.power(rightNum);
                break;
        }

        if (error) return result.fail(error);
        return result.success(resultNum?.setPosition(node.range));
    }

    passUnaryOp (node: NodeUnaryOp, context: Context) {
        let result = new RuntimeResult(this.text);

        let num: CryspNumber = result.register(this.pass(node.node, context));
        if (result.exception) return result;

        let resultNum: CryspNumber | null = num;
        let error: any;

        switch (node.operator.type) {
            case TOKEN_SUB:
                let neg1 = new CryspNumber(-1);
                [resultNum, error] = num.multiply(neg1);
                break;
        }

        if (error) return result.fail(error);
        return result.success(resultNum?.setPosition(node.range));
    }

}