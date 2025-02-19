/*
 *
 *  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 *  Bangalore, India. All Rights Reserved.
 *
 */

const _ = require('lodash');
const logger = require('loglevel').getLogger('dmn-eval-js');
const fnGen = require('../utils/helper/fn-generator');
const addKwargs = require('../utils/helper/add-kwargs');
const builtInFns = require('../utils/built-in-functions');
const resolveName = require('../utils/helper/name-resolution');

module.exports = function (ast) {
  ast.ProgramNode.prototype.build = function (data = {}, env = {}, type = 'output') {
    let args = {};
    if (!data.isContextBuilt) {
      const context = { ...data, ...builtInFns };
      args = { context, ...env };
      args.isContextBuilt = true;
    } else {
      args = data;
    }
    // bodybuilding starts here...
    // let's pump some code ;)
    const result = this.body.build(args);
    if (type === 'input') {
      if (typeof result === 'function') {
        return result;
      }
      const fnResult = function (x) {
        return x === result;
      };
      return fnResult;
    }
    return result;
  };

  ast.IntervalStartLiteralNode.prototype.build = function () {
    return fnGen(this.intervalType);
  };

  ast.IntervalEndLiteralNode.prototype.build = function () {
    return fnGen(this.intervalType);
  };

  ast.IntervalNode.prototype.build = function (args) {
    const startpoint = this.startpoint.build(args);
    const endpoint = this.endpoint.build(args);
    return (x) => {
      const startValue = this.intervalstart.build()(startpoint)(x);
      const endValue = this.intervalend.build()(endpoint)(x);
      return startValue === undefined || endValue === undefined ? undefined : startValue && endValue;
    };
  };

  ast.SimplePositiveUnaryTestNode.prototype.build = function (args) {
    const result = this.operand.build(args);

    // hack to treat input expressions as input variables and let functions in input entries reference them
    // for example: starts with(name, prefix)
    // where "name" is the input expression
    // for this to work, if the result of the function is true (like in the example above), that value cannot be
    // compared with the the evaluated input expression (which is the value of the input variable), so we must
    // patch the comparison here
    if (args.context._inputVariableName && this.operand.type === 'FunctionInvocation' && this.operand.params) {
      // patch only if there is an input variable and the simple positive unary test contains a function directly,
      // where the input variable in a parameter of that function
      const nodeIsQualifiedNameOfInputVariable = (node) => node.type === 'QualifiedName' && node.names.map((nameNode) => nameNode.nameChars).join('.') === args.context._inputVariableName;
      const inputVariableParameter = (this.operand.params.params || []).find((node) => nodeIsQualifiedNameOfInputVariable(node));
      if (inputVariableParameter) {
        if (result === true) {
          // if the function evaluates to true, compare the evaluated input expression with the evaluated input variable,
          // not with the result of the function evaluation
          return fnGen(this.operator || '==')(_, inputVariableParameter.build(args));
        } if (result === false) {
          // if the function evaluates to false, the simple positive unary test should always evaluate to false
          return () => false;
        }
      }
    }

    return fnGen(this.operator || '==')(_, result);
  };

  ast.SimpleUnaryTestsNode.prototype.build = function (data = {}) {
    const context = { ...data, ...builtInFns };
    const args = { context };
    if (this.expr) {
      const results = this.expr.map((d) => d.build(args));
      if (this.not) {
        const negResults = results.map((result) => args.context.not(result));
        return (x) => negResults.reduce((result, next) => {
          const nextValue = next(x);
          return (result === false || nextValue === false) ? false : ((result === undefined || nextValue === undefined) ? undefined : (result && nextValue));
        }, true);
      }
      return (x) => results.reduce((result, next) => {
        const nextValue = next(x);
        return (result === true || nextValue === true) ? true : ((result === undefined || nextValue === undefined) ? undefined : (result || nextValue));
      }, false);
    }
    return () => true;
  };

  ast.QualifiedNameNode.prototype.build = function (args, doNotWarnIfUndefined = false) {
    const [first, ...remaining] = this.names;
    const buildNameNode = (name) => {
      const result = { nameNode: name, value: name.build(null, false) };
      return result;
    };
    const processRemaining = (firstResult, firstExpression) => remaining.map(buildNameNode)
      .reduce((prev, next) => {
        if (prev.value === undefined) {
          return prev;
        }
        return { value: prev.value[next.value], expression: `${prev.expression}.${next.nameNode.nameChars}` };
      }, { value: firstResult, expression: firstExpression });

    const firstResult = first.build(args);
    if (remaining.length) {
      const fullResult = processRemaining(firstResult, first.nameChars);
      if (fullResult.value === undefined) {
        if (!doNotWarnIfUndefined) {
          logger.info(`'${fullResult.expression}' resolved to undefined`);
        }
      }
      return fullResult.value;
    }
    if (firstResult === undefined) {
      if (!doNotWarnIfUndefined) {
        logger.info(`'${first.nameChars}' resolved to undefined`);
      }
    }
    return firstResult;
  };

  ast.ArithmeticExpressionNode.prototype.build = function (args) {
    const operandsResult = [this.operand_1, this.operand_2].map((op) => {
      if (op === null) {
        return 0;
      }
      return op.build(args);
    });
    return fnGen(this.operator)(operandsResult[0])(operandsResult[1]);
  };

  ast.SimpleExpressionsNode.prototype.build = function (data = {}, env = {}) {
    let context = {};
    if (!data.isBuiltInFn) {
      context = { ...data, ...builtInFns, isBuiltInFn: true };
    } else {
      context = data;
    }
    const args = { context, ...env };
    return this.simpleExpressions.map((d) => d.build(args));
  };

  // _fetch is used to return the name string or
  // the value extracted from context or kwargs using the name string
  ast.NameNode.prototype.build = function (args, _fetch = true) {
    const name = this.nameChars;
    if (!_fetch) {
      return name;
    }

    return resolveName(name, args);
  };

  ast.LiteralNode.prototype.build = function () {
    return this.value;
  };

  ast.DateTimeLiteralNode.prototype.build = function (args) {
    const fn = args.context[this.symbol];
    const paramsResult = this.params.map((d) => d.build(args));
    let result;
    if (!paramsResult.includes(undefined)) {
      result = fn(...paramsResult);
    }
    return result;
  };

  // Invoking function defined as boxed expression in the context entry
  // See ast.FunctionDefinitionNode for details on declaring function
  // Function supports positional as well as named parameters
  ast.FunctionInvocationNode.prototype.build = function (args) {
    const processFormalParameters = (formalParams) => {
      const values = this.params.build(args);
      if (formalParams && values && Array.isArray(values)) {
        const kwParams = values.reduce((recur, next, i) => {
          const obj = {};
          obj[formalParams[i]] = next;
          return { ...recur, ...obj };
        }, {});
        return addKwargs(args, kwParams);
      }
      return addKwargs(args, values);
    };

    const processUserDefinedFunction = (fnMeta) => {
      const { fn } = fnMeta;
      const formalParams = fnMeta.params;

      if (formalParams) {
        return fn.build(processFormalParameters(formalParams));
      }
      return fn.build(args);
    };

    const processInBuiltFunction = (fnMeta) => {
      const doNotWarnIfUndefined = fnMeta.name === 'defined';
      const values = this.params.build(args, doNotWarnIfUndefined);
      if (Array.isArray(values)) {
        return fnMeta(...[...values, args.context]);
      }
      return fnMeta({ ...args.context, ...args.kwargs }, values);
    };

    const processDecision = (fnMeta) => {
      const { expr } = fnMeta;
      if (expr.body instanceof ast.FunctionDefinitionNode) {
        const exprResult = expr.body.build(args);
        return processUserDefinedFunction(exprResult);
      }
      const formalParametersResult = processFormalParameters();
      return expr.build(formalParametersResult);
    };

    const processFnMeta = (fnMeta) => {
      if (typeof fnMeta === 'function') {
        return processInBuiltFunction(fnMeta);
      } if (typeof fnMeta === 'object' && fnMeta.isDecision) {
        return processDecision(fnMeta);
      }
      return processUserDefinedFunction(fnMeta);
    };

    const fnNameResult = this.fnName.build(args);
    let result;
    if (fnNameResult !== undefined) {
      result = processFnMeta(fnNameResult);
    }
    return result;
  };

  ast.PositionalParametersNode.prototype.build = function (args, doNotWarnIfUndefined = false) {
    const results = this.params.map((d) => d.build(args, doNotWarnIfUndefined));
    return results;
  };

  // ast.ComparisonExpressionNode.prototype.build = function (args) {
  //   let { operator } = this;
  //   if (operator === 'between') {
  //     const results = [this.expr_1, this.expr_2, this.expr_3].map((d) => d.build(args));
  //     if ((results[0] >= results[1]) && (results[0] <= results[2])) {
  //       return true;
  //     }
  //     return false;
  //   } if (operator === 'in') {
  //     const processExpr = (operand) => {
  //       this.expr_2 = Array.isArray(this.expr_2) ? this.expr_2 : [this.expr_2];
  //       const tests = this.expr_2.map((d) => d.build(args));
  //       return tests.map((test) => test(operand)).reduce((accu, next) => accu || next, false);
  //     };
  //     return processExpr(this.expr_1.build(args));
  //   }
  //   const results = [this.expr_1, this.expr_2].map((d) => d.build(args));
  //   operator = operator !== '=' ? operator : '==';
  //   return fnGen(operator)(results[0])(results[1]);
  // };

  ast.ComparisonExpressionNode.prototype.build = function (args) {
    // const options = (args && args.context && args.context.options) || {};
    let { operator } = this;
    if (operator === 'between') {
      const results = [this.expr_1, this.expr_2, this.expr_3].map((d) => d.build(args));
      let result;
      if ((results[0] >= results[1]) && (results[0] <= results[2])) {
        result = true;
      } else {
        result = false;
      }
      // log.debug(options, `ComparisionExpressionNode - between - build success with result - ${stringify(result)}, text: ${this.text}`);
      // rlog.debug(options, 'ComparisionExpressionNode build success (between)', this.rule, this.text, stringify(result));
      return result;
    }
    if (operator === 'in') {
      const processExpr = (operand) => {
        this.expr_2 = Array.isArray(this.expr_2) ? this.expr_2 : [this.expr_2];
        const tests = this.expr_2.map((d) => d.build(args));
        const result = tests.map((test) => test(operand)).reduce((accu, next) => accu || next, false);
        return result;
      };
      const operand = this.expr_1.build(args);
      const result = processExpr(operand);
      return result;
    }
    const results = [this.expr_1, this.expr_2].map((d) => d.build(args));
    operator = operator !== '=' ? operator : '==';
    const result = fnGen(operator)(results[0])(results[1]);
    // log.debug(options, `ComparisionExpressionNode build success with result - ${stringify(result)}, text: ${this.text}`);
    // rlog.debug(options, 'ComparisionExpressionNode build sucess', this.rule, this.text, stringify(result));
    return result;
  };

  ast.InExpressionNode.prototype.build = function (args) {
    const [variable, list] = [this.name.build(null, false), this.expr.build(args)];
    if (!Array.isArray(list)) throw new Error("'In Expression' expects an array to operate on");
    const obj = { list, variable };
    return obj;
  };

  ast.QuantifiedExpressionNode.prototype.build = function (args) {
    const evalSatisfies = (argsNew) => this.expr.build(argsNew);
    const listArgsReduceCb = (variables) => (res, arg, i) => {
      const objectWithNewProperty = {};
      objectWithNewProperty[variables[i]] = arg;
      return { ...res, ...objectWithNewProperty };
    };
    const zipListsCb = (variables) => (...listArgs) => {
      const obj = listArgs.reduce(listArgsReduceCb(variables), {});
      const argsNew = addKwargs(listArgs, obj);
      return evalSatisfies({ ...args, ...argsNew });
    };
    const zipLists = (variables, lists) => _.zipWith(...lists, zipListsCb(variables));
    const processLists = (variables, lists) => zipLists(variables, lists);

    const exprs = this.inExprs.map((d) => d.build(args));
    const variables = exprs.map((expr) => expr.variable);
    const lists = exprs.map((expr) => expr.list);
    const results = processLists(variables, lists);
    const truthy = results.filter((d) => Boolean(d) === true).length;

    // log.debug(options, `QuantifiedExpressionNode - truthy length - ${truthy}, results length - ${results.length}`);
    // rlog.debug(options, 'QuantifiedExpressionNode build success', this.rule, this.text, `Truthy length: ${truthy}, Results length: ${results.length}`);
    if (this.quantity === 'some') return Boolean(truthy);
    return truthy === results.length;
  };

  ast.ListNode.prototype.build = function (args) {
    // const options = (args && args.context && args.context.options) || {};
    if (this.exprList && this.exprList.length) {
      const result = this.exprList.map((d) => d.build(args));
      // log.debug(options, `ListNode - build success with result - ${stringify(result)}, text: ${this.text}`);
      // rlog.debug(options, 'ListNode build success', this.rule, this.text, stringify(result));
      return result;
    }
    // log.warn(options, 'ListNode - No expression found');
    return [];
  };

  ast.LogicalExpressionNode.prototype.build = function (args) {
    // const options = (args && args.context && args.context.options) || {};
    const results = [this.expr_1.build(args), this.expr_2.build(args)];
    const res = [];
    res[0] = results[0] || Boolean(results[0]); // to handle null and undefined
    res[1] = results[1] || Boolean(results[1]); // to handle null and undefined
    const result = fnGen(this.operator)(res[0])(res[1]);
    // log.debug(options, `LogicalExpressionNode build success with result - ${stringify(result)}, text: ${this.text}`);
    // rlog.debug(options, 'LogicalExpressionNode build success', this.rule, this.text, stringify(result));
    return result;
  };

  ast.ForExpressionNode.prototype.build = function (args) {
    // const options = (args && args.context && args.context.options) || {};
    const evalSatisfies = (argsNew) => this.expr.build(argsNew);
    const listArgsReduceCb = (variables) => (res, arg, i) => {
      const objectWithNewProperty = {};
      objectWithNewProperty[variables[i]] = arg;
      return { ...res, ...objectWithNewProperty };
    };

    const zipListsCb = (variables) => (...listArgs) => {
      const obj = listArgs.reduce(listArgsReduceCb(variables), {});
      const argsNew = addKwargs(listArgs, obj);
      return evalSatisfies({ ...args, ...argsNew });
    };

    const zipLists = (variables, lists) => _.zipWith(...lists, zipListsCb(variables));

    const processLists = (variables, lists) => zipLists(variables, lists);

    const exprs = this.inExprs.map((d) => d.build(args));
    const variables = exprs.map((expr) => expr.variable);
    const lists = exprs.map((expr) => expr.list);
    // log.debug(options, `ForExpressionNode: variables - ${variables}, lists - ${lists}`);
    // rlog.debug(options, 'ForExpressionNode build success', this.rule, this.text, `variables: ${variables}, list: ${lists}`);
    const result = processLists(variables, lists);
    return result;
    // log.debug(options, `ForExpressionNode build success with result - ${stringify(result)}, text: ${this.text}`);
    // rlog.debug(options, 'ForExpressionNode build success', this.rule, this.text, stringify(result));
  };

  ast.IfExpressionNode.prototype.build = function (args) {
    // const options = (args && args.context && args.context.options) || {};
    const condition = this.condition.build(args);
    // log.debug(options, `IfExpressionNode - condition - ${condition}`);
    let result;
    if (condition) {
      result = this.thenExpr.build(args);
    } else {
      result = this.elseExpr.build(args);
    }
    // log.debug(options, `IfExpressionNode build success with result - ${stringify(result)}, text: ${this.text}`);
    // rlog.debug(options, 'IfExpressionNode build success', this.rule, this.text, stringify(result));
    return result;
  };

  // TODO : implement item and object filter
  // TODO : see if the filter returns a function which can be applied on the list during execution
  ast.FilterExpressionNode.prototype.build = function (args) {
    // const options = (args && args.context && args.context.options) || {};
    const exprResult = this.expr.build(args);
    // log.debug(options, `FilterExpressionNode - expr build success with result - ${exprResult},text: ${this.text}`);
    // rlog.debug(options, 'FilterExpressionNode build success (expr)', this.rule, this.text, exprResult);
    const result = exprResult.context ? exprResult.context : exprResult;
    if (this.filterExpr instanceof ast.ComparisonExpressionNode
        || this.filterExpr instanceof ast.LogicalExpressionNode
    ) {
      let kwargsNew = {};
      if (Array.isArray(result)) {
        const booleanValues = result.map((d) => {
          if (typeof d === 'object') {
            kwargsNew = addKwargs(args, d);
          } else {
            kwargsNew = addKwargs(args, {
              item: d,
            });
          }
          return this.filterExpr.build(kwargsNew);
        });
        const truthyValues = result.filter((d, i) => booleanValues[i]);
        return truthyValues;
      }
      throw new Error('filter can be applied only on a collection');
      // log.error(options, 'FilterExpressionNode - filter can only be applied on a collection', `text: ${this.text}`);
      // rlog.error(options, 'FilterExpressionNode build failed', this.rule, this.text, 'Can only be applied to a collection');
    } else {
      const value = this.filterExpr.build(args);
      if (Array.isArray(result)) {
        return result.at(value);
      } if (result) {
        throw new Error('Cannot access element of non array/list');
      }
      // It will reach here is the value is of not array type and is falsy
      return !!result;
    }
  };

  function InvokeFunction(context, ...parray) {
    const obj = {};
    if (this.params.length !== parray.length) throw new Error(`Invalid number of arguments passed expecting ${this.params.length} arguments`);
    this.params.forEach((param, i) => {
      obj[param] = parray[i];
    });
    const argsNew = addKwargs(context, obj);
    const result = this.fn.build(argsNew);
    return result;
  }

  ast.FunctionDefinitionNode.prototype.build = function (args) { // eslint-disable-line no-unused-vars
    // const options = (args && args.context && args.context.options) || {};
    const fnDfn = { isFunction: true };
    fnDfn.invoke = InvokeFunction.bind(fnDfn, args);
    if (this.formalParams && this.formalParams.length) {
      const results = this.formalParams.map((d) => d.build(null, false));
      fnDfn.fn = this.body;
      fnDfn.params = results;
      // log.debug(options, `FunctionDefinitionNode build success - body - ${stringify(this.body)}, params - ${stringify(results)}, text: ${this.text}`);
      // rlog.debug(options, 'FunctionDefinitionNode build success', this.rule, this.text, `BODY - ${stringify(this.body)}, PARAMS - ${stringify(results)}`);
      return fnDfn;
    }
    fnDfn.fn = this.body;
    fnDfn.params = null;

    // log.debug(options, `FunctionDefinitionNode build success - body - ${stringify(this.body)}, params - none, text: ${this.text}`);
    // rlog.debug(options, 'FunctionDefinitionNode build success', this.rule, this.text, `BODY - ${stringify(this.body)}, PARAMS - none`);
    return fnDfn;
  };

  ast.FunctionBodyNode.prototype.build = function (args) {
    // const options = (args && args.context && args.context.options) || {};
    if (this.extern) {
      throw new Error('External function not yet supported');
      // // log.debug(options, `FunctionBodyNode - external function found - ${this.expr}`);
      // // //rlog.debug(options, 'FunctionBodyNode ')
      // try {
      //   this.expr.build({}).then((bodyMeta) => {
      //     externalFn(Object.assign({}, args.context, args.kwargs), bodyMeta).then((res) => {
      //       // log.debug(options, `FunctionBodyNode build success with result - ${res}, text: ${this.text}`);
      //       // rlog.debug(options, 'FunctionBodyNode build success', this.rule, this.text, res);
      //       resolve(res);
      //     }).catch((err) => {
      //       // log.error(options, `FunctionBodyNode build failed with error from externalFn - ${err},text: ${this.text}`);
      //       // rlog.error(options, 'FunctionBodyNode build failed (from externalFn)', this.rule, this.text, err);
      //       reject(err);
      //     });
      //   }).catch((err) => {
      //     // log.error(options, `FunctionBodyNode build failed with error when building ${this.expr} - ${err},text: ${this.text}`);
      //     // rlog.error(options, 'FunctionBodyNode build failed', this.rule, this.text, `${err}, Expression: ${this.expr}`);
      //     reject(err);
      //   });
      // } catch (err) {
      //   // log.error(options, `FunctionBodyNode - unexpected error - ${err},text: ${this.text}`);
      //   // rlog.error(options, 'FunctionBodyNode build failed', this.rule, this.text, `Unexpected error: ${err}`);
      //   reject(err);
      // }
    } else {
      const res = this.expr.build(args);
      // log.debug(options, `FunctionBodyNode build success with result - ${stringify(res)}, text: ${this.text}`);
      // rlog.debug(options, 'FunctionBodyNode build success', this.rule, this.text, stringify(res));
      return res;
    }
  };
};
