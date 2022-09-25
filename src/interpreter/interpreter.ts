import { RuntimeException } from "../classes/exception";
import { 
    AtomNode, BaseNode, BinaryOpNode, BlockNode, BreakNode, 
    CasesNode, ContinueNode, DefaultCaseNode, DeleteNode, DoWhileNode,
    ElseNode, IfNode, RepeatNode, ReturnNode, SwitchNode, ThrowNode, 
    TryCatchNode, UnaryOpNode, VarAssignNode, VarDeclareNode, WhileNode
} from "../parser/nodes";
import { h, RTERROR_ALREADY_DECLARED, RTERROR_NOT_DEFINED } from "../strings";
import { BaseBuiltin, BooleanBuiltin, BuiltinOrErr, NullBuiltin, NumberBuiltin } from "./builtins";
import Context from "./context";
import { getBooleanValue, isBoolean, isErr, isNumber, isVariable, matchKeyword } from "./util";
import VarStore from "./varStore";

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

const ASSIGNOP_MAP: any = {
    'ASSIGN':  'set',
    'ADDTO':   'add',
    'SUBFROM': 'subtract',
    'MULBY':   'multiply',
    'DIVBY':   'divide',
    'POWERBY': 'power',
    'MODBY':   'modulo',
    'INCR':    'increment',
    'DECR':    'decrement',
}

export default class Interpreter {
    
    text?: string;
    globalVarStore = new VarStore();

    constructor (text?: string) {
        this.text = text;

        this.globalVarStore.set("Waltuh", new NumberBuiltin(69));
    }

    passAtom = (node: AtomNode, context: Context) => {
        let builtin: BaseBuiltin;

        // numeric token => number builtin
        if (isNumber(node.token))
            builtin = new NumberBuiltin(node.token.value);

        // @KEYWORD:true | @KEYWORD:false => boolean builtin
        else if (isBoolean(node.token))
            builtin = new BooleanBuiltin(getBooleanValue(node.token));

        // @IDENTIFIER => variable access
        else if (isVariable(node.token)) {
            const name  = node.token.value;
            const value = context.varStore?.get(name);

            // if the var is not defined, throw error
            if (!value) return new RuntimeException(h(RTERROR_NOT_DEFINED, name), node.range, context);

            builtin = value;
        }

        // else => null builtin
        else
            builtin = new NullBuiltin();

        return builtin
            .setPos(node.range)
            .setContext(context);
    }

    passBinaryOp = (node: BinaryOpNode, context: Context) => {
        const childLeft = this.pass(node.left, context);
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

        if (shouldEvalRight) childRight = this.pass(node.right, context);
        if (isErr(childRight)) return childRight;
        

        const result: BaseBuiltin = (childLeft as any)[method](childRight);
        return result.setPos(node.range);
    }

    passUnaryOp = (node: UnaryOpNode, context: Context) => {
        const child = this.pass(node.node, context);
        if (isErr(child)) return child;

        const method = UNARYOP_MAP[node.operator.type] || matchKeyword(UNARYOP_MAP, node.operator);
        if (!method || !(child as any)[method]) return this.passNothing();

        const result: BaseBuiltin = (child as any)[method]();
        return result.setPos(node.range);
    }

    passBlock = (node: BlockNode, context: Context) => {
        let result: BaseBuiltin = this.passNothing();

        // create separate non-function context for the block
        const blockVarStore = new VarStore(context.varStore);
        const blockContext  = new Context("_block", context, node.range?.start, false).setVarStore(blockVarStore);

        const children: BaseBuiltin[] = [];
        let err: any;

        node.nodes.forEach(child => {
            if (err) return;
            result = this.pass(child, blockContext);
            children.push(result);
            if (isErr(result)) err = result;
        });

        return err || result;
    }

    passIf = (node: IfNode, context: Context) => {
        const cond = this.pass(node.condIf, context);
        if (isErr(cond)) return cond;

        let result: BaseBuiltin = this.passNothing();

        if ((cond as any).castBool().value) result = this.pass(node.thenIf, context);
        else if (node.thenElse) result = this.pass(node.thenElse, context);

        return result;
    }

    passElse = (node: ElseNode, context: Context) => {
        return this.pass(node.block, context);
    }

    passSwitch = (node: SwitchNode, context: Context) => {
        const cond         = this.pass(node.cond, context);
        const childCases   = this.pass(node.cases, context);
        const childDefcase = node.defcase ? this.pass(node.defcase, context) : null;
    }

    passDefaultCase = (node: DefaultCaseNode, context: Context) => {
        const child = this.pass(node.block, context);
    }

    passCases = (node: CasesNode, context: Context) => {
        // TODO
    }

    passWhile = (node: WhileNode, context: Context) => {
        const cond  = this.pass(node.cond, context);
        const child = this.pass(node.block, context);
    }

    passDoWhile = (node: DoWhileNode, context: Context) => {
        const cond  = this.pass(node.cond, context);
        const child = this.pass(node.block, context);
    }

    passRepeat = (node: RepeatNode, context: Context) => {
        const expr = this.pass(node.expr, context);
        if (isErr(expr)) return expr;

        let lastBlock = this.passNothing();
        let iter = Math.round(expr.numerify().value); // make the iteration number an integer by rounding it

        for (let i = 0; i < iter; i++) lastBlock = this.pass(node.block, context);

        return lastBlock;
    }

    passTryCatch = (node: TryCatchNode, context: Context) => {
        const childTry   = this.pass(node.tryBlock, context);
        const childCatch = this.pass(node.catchBlock, context);
        const errorParam = node.errorParam ? this.pass(node.errorParam, context) : null;
    }

    passVarDeclare = (node: VarDeclareNode, context: Context) => {
        const name = node.name.value;

        if (context.varStore?.hasHere(name)) return new RuntimeException(h(RTERROR_ALREADY_DECLARED, name), node.range, context);

        let value; 
        if (node.expr) value = this.pass(node.expr, context)
        else           value = this.passNothing();
        if (isErr(value)) return value;

        context.varStore?.set(name, value);
        return value.setPos(node.range);
    }

    passVarAssign = (node: VarAssignNode, context: Context) => {
        const name = node.name.value;
        if (!context.varStore?.get(name)) 
            return new RuntimeException(h(RTERROR_NOT_DEFINED, name), node.range, context);

        // get current var value
        const currentValue = context.varStore.get(name);

        // get the corresponding method for the assignment operation
        // if not found, return null
        const method = ASSIGNOP_MAP[node.operator.type] || matchKeyword(ASSIGNOP_MAP, node.operator);
        if (!method || !(currentValue as any)[method]) return this.passNothing();

        // get the assignment value
        const assignValue = node.expr ? this.pass(node.expr, context) : null;
        if (assignValue && isErr(assignValue)) return assignValue;

        // calculate the resulting value by calling the correct method
        let value = (currentValue as any)[method](assignValue);
        if (isErr(value)) return value;

        // update the variable
        context.varStore.update(name, value);
        return value.setPos(node.range);
    }

    passReturn = (node: ReturnNode, context: Context) => {
        const child = node.expr ? this.pass(node.expr, context) : null;
    }

    passBreak = (node: BreakNode, context: Context) => {
        
    }

    passContinue = (node: ContinueNode, context: Context) => {

    }

    passDelete = (node: DeleteNode, context: Context) => {
        const child = node.expr ? this.pass(node.expr, context) : null;
    }

    passThrow = (node: ThrowNode, context: Context) => {
        const child = node.expr ? this.pass(node.expr, context) : null;
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
        'repeat':      this.passRepeat,
        'trycatch':    this.passTryCatch,

        'varDeclare':  this.passVarDeclare,
        'varAssign':   this.passVarAssign,

        'return':      this.passReturn,
        'break':       this.passBreak,
        'continue':    this.passContinue,
        'delete':      this.passDelete,
        'throw':       this.passThrow
    }

    pass = (node: BaseNode, context: Context): BaseBuiltin => {
        const result = this.methodMap[node.type];
        return result ? result(node, context) : this.passNothing();
    }

    passNothing = () => {
        return new NullBuiltin();
    }

    interpret (node: BlockNode): BuiltinOrErr {
        const globalContext = new Context('global').setVarStore(this.globalVarStore);
        return this.pass(node, globalContext);
    }

}