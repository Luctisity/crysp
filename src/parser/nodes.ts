import { PositionRange } from "../classes/position";
import { TOKEN_KEYWORD } from "../lexer/constants";
import Token from "../lexer/token";

export class BaseNode {

    type = 'base';
    range?: PositionRange;

    toString () {
        return 'BaseNode';
    }

    setPos (range?: PositionRange) {
        this.range = range;
        return this;
    }

}

export class AtomNode extends BaseNode {

    type = 'atom';

    token: Token;

    constructor (token: Token) {
        super();
        this.token = token;
    }

    toString () {
        return this.token.toString();
    }

}

export class BinaryOpNode extends BaseNode {

    type = 'binaryOp';

    left:     BaseNode;
    operator: Token;
    right:    BaseNode;

    constructor (left: BaseNode, operator: Token, right: BaseNode) {
        super();
        this.left     = left;
        this.operator = operator;
        this.right    = right;
    }

    toString () {
        return `( ${this.left} ${this.operator} ${this.right} )`;
    }

}

export class UnaryOpNode extends BaseNode {

    type = 'unaryOp';

    operator: Token;
    node:     BaseNode;

    constructor (operator: Token, node: BaseNode) {
        super();
        this.operator = operator;
        this.node     = node;
    }

    toString () {
        return `( ${this.operator} ${this.node} )`;
    }

}

export class BlockNode extends BaseNode {

    type = 'block';

    nodes: BaseNode[];

    constructor (...nodes: BaseNode[]) {
        super();
        this.nodes = nodes.filter(node => !node || !['BLOCKSEP', 'NEWL'].includes(node.type));
    }

    toString () {
        return `{\n\n${this.nodes.join('; \n')}\n\n}`;
    }

}

export class IfNode extends BaseNode {

    type = 'if';

    condIf:    BaseNode;
    thenIf:    BaseNode;
    thenElse?: BaseNode;

    constructor (_keyword: Token, condIf: BaseNode, thenIf: BaseNode, thenElse?: BaseNode) {
        super();
        this.condIf   = condIf;
        this.thenIf   = thenIf;
        this.thenElse = thenElse;
    }

    toString () {
        return `if ${this.condIf} then ${this.thenIf} ${this.thenElse || ""}`;
    }

}

export class ElseNode extends BaseNode {

    type = 'else';

    block: BaseNode;

    constructor (_keyword: Token, block: BaseNode) {
        super();
        this.block = block;
    }

    toString () {
        return `else ${this.block}`;
    }

}

export class SwitchNode extends BaseNode {

    type = 'switch';

    cond:     BaseNode;
    cases:    BaseNode;
    defcase?: BaseNode;

    constructor (_keyword: Token, cond: BaseNode, cases: BaseNode, defcase?: BaseNode) {
        
        super();
        this.cond    = cond;
        this.cases   = cases;
        this.defcase = defcase;

        if (this.cases instanceof DefaultCaseNode) {
            this.defcase = this.cases;
            this.cases = new CasesNode();
        }
    }

    toString () {
        return `switch ${this.cond} {\n${this.cases}${this.defcase || ''}\n}`;
    }

}

export type CasesNodeCase = {
    cond:   BaseNode,
    block?: BaseNode
}

export class DefaultCaseNode extends BaseNode {

    type = 'defaultCase';
    block: BaseNode;

    constructor (_keyword: Token, block: BaseNode) {
        super();
        this.block = block;
    }

    toString() {
        return `\ndefault: ${this.block}`;
    }

}

export class CasesNode extends BaseNode {

    type = 'cases';
    cases: CasesNodeCase[] = [];
    nodes: any[];

    constructor (...nodes: BaseNode[]) {
        super();

        this.nodes = nodes;
        
        let type = 0;
        let lastItem: any = {};
        nodes.forEach((node: any) => {
            if (node && node.type == TOKEN_KEYWORD) type = 0;
            switch (type) {
                case 0: break;
                case 1: 
                    lastItem = { cond: node.nodes ? node.nodes[0]: node }; 
                    this.cases.push(lastItem);
                    break;
                case 2: 
                    this.cases[this.cases.length-1].block = node; 
                    break;
            }
            type++;
            type %= 3;
        });
    }

    toString () {
        return this.cases.map(m => `case ${m.cond}: ${m.block || ''}`).join('\n');
    }

}

export class WhileNode extends BaseNode {

    type = 'while';

    cond:  BaseNode;
    block: BaseNode;

    constructor (_keyword: Token, cond: BaseNode, block: BaseNode) {
        super();
        this.cond  = cond;
        this.block = block;
    }

    toString () {
        return `while ${this.cond} ${this.block}`;
    }

}

export class DoWhileNode extends BaseNode {

    type = 'dowhile';

    cond:  BaseNode;
    block: BaseNode;

    constructor (_do: Token, block: BaseNode, _while: Token, cond: BaseNode) {
        super();
        this.cond  = cond;
        this.block = block;
    }

    toString () {
        return `do ${this.block} while ${this.cond}`;
    }

}

export class TryCatchNode extends BaseNode {

    type = 'trycatch';

    tryBlock:    BaseNode;
    catchBlock:  BaseNode;
    errorParam?: BaseNode;

    constructor (_try: Token, tryBlock: BaseNode, _catch: Token, errorParam: BaseNode, catchBlock?: BaseNode) {
        super();
        this.tryBlock  = tryBlock;
        if (catchBlock) {
            this.catchBlock = catchBlock;
            this.errorParam = errorParam
        } else {
            this.catchBlock = errorParam;
        }
    }

    toString () {
        return `try ${this.tryBlock} catch ${this.errorParam || ""} ${this.catchBlock}`;
    }

}

export class ReturnNode extends BaseNode {

    type = 'return';
    expr?: BaseNode;

    constructor (_keyword: Token, expr?: BaseNode) {
        super();
        this.expr = expr;
    }

    toString () {
        return `[return ${this.expr || ""}]`;
    }

}

export class BreakNode extends BaseNode {

    type = 'break';
    
    toString () {
        return `[break]`;
    }

}

export class ContinueNode extends BaseNode {

    type = 'continue';
    
    toString () {
        return `[continue]`;
    }

}

export class DeleteNode extends BaseNode {

    type = 'delete';
    expr: BaseNode;

    constructor (_keyword: Token, expr: BaseNode) {
        super();
        this.expr = expr;
    }

    toString () {
        return `[delete ${this.expr}]`;
    }


}

export class ThrowNode extends BaseNode {

    type = 'throw';
    expr: BaseNode;

    constructor (_keyword: Token, expr: BaseNode) {
        super();
        this.expr = expr;
    }

    toString () {
        return `[throw ${this.expr}]`;
    }

}

// this system needs to be redone at some point

export const NODE_MAP = {
    '@INT':            AtomNode,    // number values
    '@FLOAT':          AtomNode,    // number values
    '@STRING':         AtomNode,    // string values
    '@KEYWORD:true':   AtomNode,    // boolean values
    '@KEYWORD:false':  AtomNode,    // boolean values
    '@KEYWORD:null':   AtomNode,    // null value

    '%':     'pass',            // signle nodes
    '%,@,%': BinaryOpNode,      // binary operators
    '%,@BLOCKSEP,%': BlockNode, // node + block separation token + node is a block, not a binary operator
    '@,%':   UnaryOpNode,       // unary operators
    '@KEYWORD,%':   'pass',
    '@KEYWORD:not,%': UnaryOpNode, // unary operators
    '%,@KEYWORD,%': 'pass',
    '%,@KEYWORD:is,%': BinaryOpNode,
    '%,@KEYWORD:and,%': BinaryOpNode,
    '%,@KEYWORD:or,%': BinaryOpNode,

    '@KEYWORD:if,%,%':   IfNode,   // if
    '@KEYWORD:else,%': ElseNode, // else

    '@KEYWORD:switch,%,%': SwitchNode,      // switch
    '@KEYWORD:case,%':     CasesNode,       // switch cases
    '@KEYWORD:default,%':  DefaultCaseNode, // switch default case

    '@KEYWORD:while,%,%':               WhileNode,    // while
    '@KEYWORD:do,%,@KEYWORD:while,%': DoWhileNode,  // do while
    
    '@KEYWORD:return':   ReturnNode,   // return command
    '@KEYWORD:break':    BreakNode,    // break command
    '@KEYWORD:continue': ContinueNode, // continue command
    '@KEYWORD:delete,%': DeleteNode,   // delete command
    '@KEYWORD:throw,%':  ThrowNode,    // throw command

    '@KEYWORD:try,%,@KEYWORD:catch': TryCatchNode, // try-catch

}

export const NODE_INPUT_NODES = [
    'left', 'right', 'node', 'condIf', 'thenIf', 'thenElse', 
    'block', 'cond', 'cases', 'defcase', 'tryBlock', 'catchBlock', 
    'errorParam', 'expr'
]