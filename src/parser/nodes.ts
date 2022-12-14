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

export class MemberAccessNode extends BaseNode {

    type = 'memberAccess';

    expr:      BaseNode;
    operator:  Token;
    member:    BaseNode | Token;
    closeTok?: Token;

    constructor (expr: BaseNode, operator: Token, member: BaseNode | Token, closeTok?: Token) {
        super();
        this.expr = expr;
        this.operator = operator;
        this.member = member;
        this.closeTok = closeTok;
    }

    toString () {
        return `( ${this.expr} ${this.operator} ${this.member} ${this.closeTok || ""} )`;
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
    cases:    CasesNode;
    defcase?: DefaultCaseNode;

    constructor (_keyword: Token, cond: BaseNode, cases: CasesNode, defcase?: DefaultCaseNode) {
        
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
    cond:  BaseNode,
    block: BaseNode
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

export class RepeatNode extends BaseNode {

    type = 'repeat';

    expr:  BaseNode;
    block: BaseNode;

    constructor (_keyword: Token, expr: BaseNode, block: BaseNode) {
        super();
        this.expr  = expr;
        this.block = block;
    }

    toString () {
        return `repeat ${this.expr} ${this.block}`;
    }

}

export class TryCatchNode extends BaseNode {

    type = 'trycatch';

    tryBlock:    BaseNode;
    catchBlock:  BaseNode;
    errorParam?: Token;

    constructor (_try: Token, tryBlock: BaseNode, _catch: Token, errorParam: any, catchBlock?: BaseNode) {
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

export class VarDeclareNode extends BaseNode {

    type = 'varDeclare';

    name:  Token;
    expr?:  BaseNode;

    constructor (_keyword: Token, name: Token, expr?: BaseNode) {
        super();
        this.name  = name;
        this.expr  = expr;
    }

    toString () {
        return `[let ${this.name}${this.expr ? ' = ' + this.expr : ''}]`;
    }

}

export class VarAssignNode extends BaseNode {

    type = 'varAssign';

    name:     Token;
    operator: Token;
    expr?:    BaseNode;

    constructor (name: Token, operator: Token, expr?: BaseNode) {
        super();
        this.name     = name;
        this.operator = operator;
        this.expr     = expr;
    }

    toString () {
        return `[${this.name} ${this.operator} ${this.expr}]`;
    }

}

export class MemberAssignNode extends BaseNode {

    type = 'memberAssign';

    member:   BaseNode;
    operator: Token;
    expr?:    BaseNode;

    constructor (member: BaseNode, operator: Token, expr?: BaseNode) {
        super();
        this.member   = member;
        this.operator = operator;
        this.expr     = expr;
    }

    toString () {
        return `[MEM ${this.member} ${this.operator} ${this.expr}]`;
    }

}

export class FuncDeclareNode extends BaseNode {

    type = 'funcDeclare';

    name?: Token;
    args?: any[] = [];
    expr:  BaseNode;
    oneLiner = false;

    constructor (_keyword: Token, ...args: any[]) {
        super();
        if (args[0] instanceof Token) this.name = args.shift();
        this.expr = args.pop();
        if (!(this.expr instanceof BlockNode)) this.oneLiner = true;
        this.args = args;
    }

    toString () {
        return `[func ${this.name} (${this.args}) => ${this.expr}]`;
    }

}

export class AnonymousFuncDeclareNode extends BaseNode {

    type = 'anonymousFuncDeclare';

    args?: any[] = [];
    expr:  BaseNode;
    oneLiner = false;

    constructor (_keyword: Token, ...args: any[]) {
        super();
        this.expr = args.pop();
        if (!(this.expr instanceof BlockNode)) this.oneLiner = true;
        this.args = args;
    }

    toString () {
        return `[func (${this.args}) => ${this.expr}]`;
    }

}

export class FuncCallNode extends BaseNode {

    type = 'funcCall';

    expr:  BaseNode;
    args?: BaseNode;

    constructor (expr: BaseNode, args?: FuncArgsNode) {
        super();
        this.expr = expr;
        this.args = args || undefined;
    }

    toString () {
        return `${this.expr}(${this.args || ""})`;
    }

}

export class FuncArgsNode extends BaseNode {

    type = 'funcArgs';

    nodes: BaseNode[] = [];

    constructor (...nodes: BaseNode[]) {
        super();
        this.nodes = nodes;
    }

    toString () {
        return this.nodes.join();
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

export const NODES: any = {
    'atom':         AtomNode,
    'binaryOp':     BinaryOpNode,
    'unaryOp':      UnaryOpNode,
    'block':        BlockNode,
    'memberAccess': MemberAccessNode,

    'if':           IfNode,
    'else':         ElseNode,
    'switch':       SwitchNode,
    'defaultCase':  DefaultCaseNode,
    'cases':        CasesNode,

    'while':        WhileNode,
    'dowhile':      DoWhileNode,
    'repeat':       RepeatNode,
    'trycatch':     TryCatchNode,

    'varDeclare':   VarDeclareNode,
    'varAssign':    VarAssignNode,
    'memberAssign': MemberAssignNode,
    'funcDeclare':  FuncDeclareNode,
    'anonymousFuncDeclare': AnonymousFuncDeclareNode,
    'funcCall':     FuncCallNode,
    'funcArgs':     FuncArgsNode,
    
    'return':       ReturnNode,
    'break':        BreakNode,
    'continue':     ContinueNode,
    'delete':       DeleteNode,
    'throw':        ThrowNode
}

export const NODE_INPUT_NODES = [
    'left', 'right', 'node', 'condIf', 'thenIf', 'thenElse', 
    'block', 'cond', 'cases', 'defcase', 'tryBlock', 'catchBlock', 'expr'
]


// this is extremely messy, idk why doesnt it work according to the grammar rules
// but this needs to be fixed and removed ASAP
export const NODE_INPUT_REQUIRED: any = {
    'binaryOp':  ['left', 'right'], 
    'unaryOp':   ['node'],
    'varAssign': ['expr'],
    'memberAssign': ['expr'],
    'if': ['thenIf'],
    'else': ['block'],
    'switch': ['cases'],
    'while': ['block'],
    'dowhile': ['block'],
    'repeat': ['block'],
    'funcDeclare': ['expr'],
    'anonymousFuncDeclare': ['expr']
}