import { PositionRange } from "../classes/position";
import Token from "../lexer/token";

export class NodeBase {

    range?: PositionRange;

    toString () {
        return `[NodeBase]`;
    }

}

export class NodeNumeric extends NodeBase {

    token: Token;

    constructor (token: Token) {
        super();
        this.token = token;
        this.range = token.range;
    }

    toString () {
        return `[NodeNumeric:${this.token.type}:${this.token.value}]`;
    }

}

export class NodeVariable extends NodeBase {

    varName: Token;

    constructor (token: Token) {
        super();
        this.varName = token;
        this.range = token.range;
    }

    toString () {
        return `[Variable:${this.varName.value}]`;
    }

}

export class NodeAssignment extends NodeBase {

    varName:  Token;
    varValue: any;

    constructor (name: Token, value: any) {
        super();
        this.varName = name;
        this.varValue = value;

        this.range = new PositionRange(this.varName.range!.start, this.varValue.range!.end);
    }

    toString () {
        return `[NodeAssignment:${this.varName}:${this.varValue}]`;
    }

}

export class NodeBinaryOp extends NodeBase {

    leftNode:  NodeBase;
    rightNode: NodeBase;
    operator:  Token;

    constructor (leftNode: NodeBase, rightNode: NodeBase, operator: Token) {
        super();
        this.leftNode  = leftNode;
        this.rightNode = rightNode;
        this.operator  = operator;

        if (this.leftNode.range && this.rightNode.range) {
            this.range = new PositionRange(
                this.leftNode.range.start,
                this.rightNode.range.end
            );
        }
    }

    toString () {
        return `[NodeBinaryOp:${this.leftNode}:${this.operator.type}:${this.rightNode}]`;
    }

}

export class NodeUnaryOp extends NodeBase {

    node:      NodeBase;
    operator:  Token;

    constructor (node: NodeBase, operator: Token) {
        super();
        this.node = node;
        this.operator = operator;

        if (this.operator.range && this.node.range) {
            this.range = new PositionRange(
                this.operator.range.start,
                this.node.range.end
            );
        }
    }

    toString () {
        return `[NodeUnaryOp:${this.operator.type}:${this.node}]`;
    }

}