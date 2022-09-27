import { Exception, RuntimeException } from "../classes/exception";
import { 
    AnonymousFuncDeclareNode,
    AtomNode, BaseNode, BinaryOpNode, BlockNode, BreakNode, 
    CasesNode, ContinueNode, DefaultCaseNode, DeleteNode, DoWhileNode,
    ElseNode, FuncArgsNode, FuncCallNode, FuncDeclareNode, IfNode, RepeatNode, ReturnNode, SwitchNode, ThrowNode, 
    TryCatchNode, UnaryOpNode, VarAssignNode, VarDeclareNode, WhileNode
} from "../parser/nodes";
import { h, RTERROR_ALREADY_DECLARED, RTERROR_ILLEGAL_BLOCK_BREAK, RTERROR_NOT_A_FUNC, RTERROR_NOT_DEFINED, RTERROR_NOT_ENOUGH_ARGS } from "../strings";
import BlockBreak, { BlockBreakType } from "./blockBreak";
import { BaseBuiltin, BooleanBuiltin, BuiltinOrErr, FuncBuiltin, NullBuiltin, NumberBuiltin, StringBuiltin } from "./builtins";
import Context from "./context";
import { getBooleanValue, isBlockBreak, isBoolean, isErr, isNumber, isString, isVariable, matchKeyword } from "./util";
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

        // string token => string builtin
        else if (isString(node.token))
            builtin = new StringBuiltin(node.token.value);

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
        let aborted: boolean = false;

        // hoist function delcarations
        const nodesHoist = node.nodes.filter(f => f.type == 'funcDeclare');
        const nodesRest  = node.nodes.filter(f => f.type != 'funcDeclare');   

        const iter = (child: BaseNode) => {
            if (err || aborted) return;
            result = this.pass(child, blockContext);
            children.push(result);
            if (isErr(result)) err = result;
            else if (isBlockBreak(result)) {

                if (isBlockBreak(result, BlockBreakType.FUNCTION) && !blockContext.isInsideAFunc())
                    err = new RuntimeException(RTERROR_ILLEGAL_BLOCK_BREAK[BlockBreakType.FUNCTION], result.range, result.context);

                else if (isBlockBreak(result, BlockBreakType.LOOP) && !blockContext.isInsideALoop())
                    err = new RuntimeException(RTERROR_ILLEGAL_BLOCK_BREAK[BlockBreakType.LOOP], result.range, result.context);

                else if (isBlockBreak(result, BlockBreakType.ITERATION) && !blockContext.isInsideALoop())
                    err = new RuntimeException(RTERROR_ILLEGAL_BLOCK_BREAK[BlockBreakType.ITERATION], result.range, result.context);

                aborted = true;
            }
        }

        nodesHoist.forEach(iter);
        nodesRest.forEach(iter);

        return err || result;
    }

    passIf = (node: IfNode, context: Context) => {
        const cond = this.pass(node.condIf, context);
        if (isErr(cond)) return cond;

        let result: BaseBuiltin = this.passNothing();

        if (cond.castBool().value) result = this.pass(node.thenIf, context);
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
        let cond  = this.pass(node.cond, context);
        if (isErr(cond)) return cond;

        const loopVarStore = new VarStore(context.varStore);
        const loopContext  = new Context(
            "loop", context, node.range?.start, false, true
        ).setVarStore(loopVarStore);

        let lastBlock = this.passNothing();
        while (cond.castBool().value) {
            let b = this.pass(node.block, loopContext);

            if (isBlockBreak(b)) {
                if (isBlockBreak(b, BlockBreakType.LOOP)) break;
            }
            else lastBlock = b;

            cond = this.pass(node.cond, context);
            if (isErr(cond)) return cond;
        }

        return lastBlock;
    }

    passDoWhile = (node: DoWhileNode, context: Context) => {
        let lastBlock = this.pass(node.block, context);
        if (isErr(lastBlock)) return;

        let cond  = this.pass(node.cond, context);
        if (isErr(cond)) return cond;

        while (cond.castBool().value) {
            lastBlock = this.pass(node.block, context);

            cond = this.pass(node.cond, context);
            if (isErr(cond)) return cond;
        }

        return lastBlock;
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
        const childTry: any = this.pass(node.tryBlock, context);

        // if caught error in the try block...
        if (isErr(childTry)) {

            // ... create a new var context and put the errorParam (exception stringified) in it, if present
            const catchVarStore = new VarStore(context.varStore);
            if (node.errorParam) {
                const errorStr = new StringBuiltin((childTry as Exception).details || (childTry as Exception).type);
                catchVarStore.set(node.errorParam.value, errorStr);
            }
            const catchContext = new Context(
                "trycatch", context, node.range?.start, false
            ).setVarStore(catchVarStore);

            // pass the catch block with the new context
            const childCatch = this.pass(node.catchBlock, catchContext);
            return childCatch;
        }

        return childTry;
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

    passFuncDeclare = (node: FuncDeclareNode, context: Context) => {
        const name = node.name?.value;

        if (context.varStore?.hasHere(name)) return new RuntimeException(h(RTERROR_ALREADY_DECLARED, name), node.range, context);

        const value  = node.expr;
        const params = node.args?.map(m => m.value || m.token?.value);
        const func   = new FuncBuiltin(value, name, params);
        context.varStore?.set(name, func);

        return name ? this.passNothing() : func;
    }

    passFuncCall = (node: FuncCallNode, context: Context) => {
        const name  = node.name.value;
        const value = context.varStore?.get(name);

        // if the var is not defined or is not a function, throw error
        if (!value)        return new RuntimeException(h(RTERROR_NOT_DEFINED, name), node.range, context);
        if (!value.isFunc) return new RuntimeException(h(RTERROR_NOT_A_FUNC,  name), node.range, context);

        // args can come in different types for some reason
        let args: BaseNode[] = [];
        if (node.args instanceof FuncArgsNode) args = node.args.nodes;
        else if (node.args) args = [node.args];

        const params = (value as FuncBuiltin).params;

        // if the number of provided args is less than the number of expected params, error
        if (args.length < params.length) return new RuntimeException(h(RTERROR_NOT_ENOUGH_ARGS, name), node.range, context);

        // create separate function varstore
        const funcVarStore = new VarStore(context.varStore);

        // define all arguments as variables in the func's scope
        let err: any;
        args.forEach((arg, index) => {
            if (err) return;

            const paramName = params[index];
            if (!paramName) return;

            let result = this.pass(arg, context);
            if (isErr(result)) {
                err = result;
                return;
            }

            funcVarStore.set(paramName, result);
        });
        if (err) return err;

        // create separate function context
        const funcContext  = new Context(
            (value as FuncBuiltin).name, context, node.range?.start, true
        ).setVarStore(funcVarStore);

        const result: any = this.pass(value.value, funcContext);

        if (isErr(result)) return result;
        if (!isBlockBreak(result, BlockBreakType.FUNCTION)) return this.passNothing();
        return (result as BlockBreak).value;
    }

    passReturn = (node: ReturnNode, context: Context) => {
        const child = node.expr ? this.pass(node.expr, context) : undefined;

        if (child && isErr(child)) return child;

        return new BlockBreak(BlockBreakType.FUNCTION, child)
            .setPos(node.range).setContext(context);
    }

    passBreak = (node: BreakNode, context: Context) => {
        return new BlockBreak(BlockBreakType.LOOP)
            .setPos(node.range).setContext(context);
    }

    passContinue = (node: ContinueNode, context: Context) => {
        return new BlockBreak(BlockBreakType.ITERATION)
            .setPos(node.range).setContext(context);
    }

    passDelete = (node: DeleteNode, context: Context) => {
        const child = node.expr ? this.pass(node.expr, context) : null;
    }

    passThrow = (node: ThrowNode, context: Context) => {
        const child = node.expr ? this.pass(node.expr, context) : null;

        if (!child)       return this.passNothing();
        if (isErr(child)) return child;
        
        console.log('[LOGS]', child.value);
        return this.passNothing();
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
        'funcDeclare': this.passFuncDeclare,
        'anonymousFuncDeclare': this.passFuncDeclare,
        'funcCall':    this.passFuncCall,

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
        const result: any = this.pass(node, globalContext);

        if (isBlockBreak(result)) {
            return new RuntimeException(
                RTERROR_ILLEGAL_BLOCK_BREAK[(result as BlockBreak).type], result.range, result.context
            )
        }

        return result;
    }

}