import { RuntimeException } from "../classes/exception";
import { 
    AtomNode, BaseNode, BinaryOpNode, BlockNode, BreakNode, 
    CasesNode, ContinueNode, DefaultCaseNode, DeleteNode, DoWhileNode,
    ElseNode, IfNode, ReturnNode, SwitchNode, ThrowNode, TryCatchNode, 
    UnaryOpNode, WhileNode
} from "../parser/nodes";
import { BaseBuiltin, BooleanBuiltin, BuiltinOrErr, NullBuiltin, NumberBuiltin } from "./builtins";
import { getBooleanValue, isBoolean, isErr, isNumber, matchKeyword } from "./util";

const BINARYOP_MAP: any = {
    'ADD': 'add',
    'SUB': 'subtract',
    'MUL': 'multiply',
    'DIV': 'divide',
    'POW': 'power',
    'MOD': 'modulo',

    'EQUALS':    'equals',
    'is':        'equals',  // the "is" keyword
    'NOTEQ':     'notEquals',
    'GREATER':   'greater',
    'LESS':      'less',
    'GREATEREQ': 'greaterEq',
    'LESSEQ':    'lessEq',

    'AND': 'and',
    'OR':  'or',
    'and': 'and', // the "and" keyword
    'or':  'or',  // the "or" keyword
}

const UNARYOP_MAP: any = {
    'ADD': 'numerify',
    'SUB': 'negate',
    'NOT': 'invert',
    'not': 'invert', // the "not" keyword
}

export default class Interpreter {
    
    text?: string;

    constructor (text?: string) {
        this.text = text;
    }

    passAtom = (node: AtomNode) => {
        let builtin: BaseBuiltin;

        // numeric token => number builtin
        if (isNumber(node.token))
            builtin = new NumberBuiltin(node.token.value);

        // @KEYWORD:true | @KEYWORD:false => boolean builtin
        else if (isBoolean(node.token))
            builtin = new BooleanBuiltin(getBooleanValue(node.token));

        // else => null builtin
        else
            builtin = new NullBuiltin();

        return builtin.setPos(node.range);
    }

    passBinaryOp = (node: BinaryOpNode) => {
        const childLeft = this.pass(node.left);
        if (isErr(childLeft)) return childLeft;

        const method = BINARYOP_MAP[node.operator.type] || matchKeyword(BINARYOP_MAP, node.operator);
        if (!method || !(childLeft as any)[method]) return this.passNothing();

        let childRight = this.passNothing();
        let shouldEvalRight = false;

        // don't evaluate the right side of an OR operation if the left side is truthy
        // don't evaluate the right side of an AND operation if the left side if falsy
             if (method == 'or' && !childLeft.castBool().value) shouldEvalRight = true;
        else if (method == 'and' && childLeft.castBool().value) shouldEvalRight = true;
        else if (method != 'or' && method != 'and')             shouldEvalRight = true;

        if (shouldEvalRight) childRight = this.pass(node.right);
        if (isErr(childRight)) return childRight;
        

        const result: BaseBuiltin = (childLeft as any)[method](childRight);
        return result.setPos(node.range);
    }

    passUnaryOp = (node: UnaryOpNode) => {
        const child = this.pass(node.node);
        if (isErr(child)) return child;

        const method = UNARYOP_MAP[node.operator.type] || matchKeyword(UNARYOP_MAP, node.operator);
        if (!method || !(child as any)[method]) return this.passNothing();

        const result: BaseBuiltin = (child as any)[method]();
        return result.setPos(node.range);
    }

    passBlock = (node: BlockNode) => {
        let result: BaseBuiltin = this.passNothing();

        const children: BaseBuiltin[] = [];
        let err: any;

        node.nodes.forEach(child => {
            result = this.pass(child);
            children.push(result);
            if (isErr(result)) err = result;
        });

        return err || result;
    }

    passIf = (node: IfNode) => {
        const cond = this.pass(node.condIf);
        if (isErr(cond)) return cond;

        let result: BaseBuiltin = this.passNothing();

        if ((cond as any).castBool().value) result = this.pass(node.thenIf);
        else if (node.thenElse) result = this.pass(node.thenElse);

        return result;
    }

    passElse = (node: ElseNode) => {
        return this.pass(node.block);
    }

    passSwitch = (node: SwitchNode) => {
        const cond         = this.pass(node.cond);
        const childCases   = this.pass(node.cases);
        const childDefcase = node.defcase ? this.pass(node.defcase) : null;
    }

    passDefaultCase = (node: DefaultCaseNode) => {
        const child = this.pass(node.block);
    }

    passCases = (node: CasesNode) => {
        // TODO
    }

    passWhile = (node: WhileNode) => {
        const cond  = this.pass(node.cond);
        const child = this.pass(node.block);
    }

    passDoWhile = (node: DoWhileNode) => {
        const cond  = this.pass(node.cond);
        const child = this.pass(node.block);
    }

    passTryCatch = (node: TryCatchNode) => {
        const childTry   = this.pass(node.tryBlock);
        const childCatch = this.pass(node.catchBlock);
        const errorParam = node.errorParam ? this.pass(node.errorParam) : null;
    }

    passReturn = (node: ReturnNode) => {
        const child = node.expr ? this.pass(node.expr) : null;
    }

    passBreak = (node: BreakNode) => {
        
    }

    passContinue = (node: ContinueNode) => {

    }

    passDelete = (node: DeleteNode) => {
        const child = node.expr ? this.pass(node.expr) : null;
    }

    passThrow = (node: ThrowNode) => {
        const child = node.expr ? this.pass(node.expr) : null;
    }
    

    methodMap: any = {
        'atom':        this.passAtom,

        'binaryOp':    this.passBinaryOp,
        'unaryOp':     this.passUnaryOp,
        'block':       this.passBlock,

        'if':          this.passIf,
        'else':        this.passElse,
        'switch':      this.passSwitch,
        'defaultCase': this.passDefaultCase,
        'cases':       this.passCases,

        'while':       this.passWhile,
        'dowhile':     this.passDoWhile,
        'trycatch':    this.passTryCatch,

        'return':      this.passReturn,
        'break':       this.passBreak,
        'continue':    this.passContinue,
        'delete':      this.passDelete,
        'throw':       this.passThrow
    }

    pass = (node: BaseNode): BaseBuiltin => {
        const result = this.methodMap[node.type];
        return result ? result(node) : this.passNothing();
    }

    passNothing = () => {
        return new NullBuiltin();
    }

    interpret (node: BlockNode): BuiltinOrErr {
        return this.pass(node.nodes[0]);
    }

}