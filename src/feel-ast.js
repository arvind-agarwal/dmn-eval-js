/*
*
*  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
*  Bangalore, India. All Rights Reserved.
*
*/

const ast = {};

/* Begin AST Node Constructors */
function ProgramNode(body, loc) {
  this.type = 'Program';
  this.body = body;
  this.loc = loc;
}

function IntervalStartLiteralNode(intervalType, loc) {
  this.type = 'IntervalStartLiteral';
  this.intervalType = intervalType;
  this.loc = loc;
}

function IntervalEndLiteralNode(intervalType, loc) {
  this.type = 'IntervalEndLiteral';
  this.intervalType = intervalType;
  this.loc = loc;
}

function IntervalNode(intervalstart, startpoint, endpoint, intervalend, loc) {
  this.type = 'Interval';
  this.intervalstart = intervalstart;
  this.startpoint = startpoint;
  this.endpoint = endpoint;
  this.intervalend = intervalend;
  this.loc = loc;
}

function SimplePositiveUnaryTestNode(operator, operand, loc) {
  this.type = 'SimplePositiveUnaryTest';
  this.operator = operator;
  this.operand = operand;
  this.loc = loc;
}

function SimpleUnaryTestsNode(expr, not, loc) {
  this.type = 'SimpleUnaryTestsNode';
  this.expr = expr;
  this.not = not;
  this.loc = loc;
}

function QualifiedNameNode(names, loc) {
  this.type = 'QualifiedName';
  this.names = names;
  this.loc = loc;
}

function ArithmeticExpressionNode(operator, operand1, operand2, loc) {
  this.type = 'ArithmeticExpression';
  this.operator = operator;
  this.operand_1 = operand1;
  this.operand_2 = operand2;
  this.loc = loc;
}

function SimpleExpressionsNode(simpleExpressions, loc) {
  this.type = 'SimpleExpressions';
  this.simpleExpressions = simpleExpressions;
  this.loc = loc;
}

function NameNode(nameChars, loc) {
  this.type = 'Name';
  this.nameChars = nameChars;
  this.loc = loc;
}

function LiteralNode(value, loc) {
  this.type = 'Literal';
  this.value = value;
  this.loc = loc;
}

function DateTimeLiteralNode(symbol, params, loc) {
  this.type = 'DateTimeLiteral';
  this.symbol = symbol;
  this.params = params;
  this.loc = loc;
}

function DecimalNumberNode(integer, decimal, loc) {
  this.type = 'DecimalNumberNode';
  this.integer = integer;
  this.decimal = decimal;
  this.loc = loc;
}

function FunctionInvocationNode(fnName, params, loc) {
  this.type = 'FunctionInvocation';
  this.fnName = fnName;
  this.params = params;
  this.loc = loc;
}

function PositionalParametersNode(params, loc) {
  this.type = 'PositionalParameters';
  this.params = params;
  this.loc = loc;
}

function ComparisonExpressionNode(operator, expr1, expr2, expr3, loc, text, rule) {
  this.type = 'ComparisonExpression';
  this.operator = operator;
  this.expr_1 = expr1;
  this.expr_2 = expr2;
  this.expr_3 = expr3;
  this.loc = loc;
  this.text = text;
  this.rule = rule;
}

function LogicalExpressionNode(operator, expr1, expr2, loc, text, rule) {
  this.type = 'LogicalExpression';
  this.operator = operator;
  this.expr_1 = expr1;
  this.expr_2 = expr2;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function InExpressionNode(name, expr, loc, text, rule) {
  this.type = 'InExpression';
  this.name = name;
  this.expr = expr;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function QuantifiedExpressionNode(quantity, inExprs, expr, loc, text, rule) {
  this.type = 'QuantifiedExpression';
  this.quantity = quantity;
  this.inExprs = inExprs;
  this.expr = expr;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function ListNode(exprList, loc, text, rule) {
  this.type = 'List';
  this.exprList = exprList;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function ForExpressionNode(inExprs, expr, loc, text, rule) {
  this.type = 'ForExpression';
  this.inExprs = inExprs;
  this.expr = expr;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function IfExpressionNode(condition, thenExpr, elseExpr, loc, text, rule) {
  this.type = 'IfExpression';
  this.condition = condition;
  this.thenExpr = thenExpr;
  this.elseExpr = elseExpr;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function FilterExpressionNode(expr, filterExpr, loc, text, rule) {
  this.type = 'FilterExpression';
  this.expr = expr;
  this.filterExpr = filterExpr;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function FunctionDefinitionNode(formalParams, body, loc, text, rule) {
  this.type = 'FunctionDefinition';
  this.formalParams = formalParams;
  this.body = body;
  this.loc = loc; this.text = text;
  this.rule = rule;
}

function FunctionBodyNode(expr, extern, loc, text, rule) {
  this.type = 'FunctionBody';
  this.expr = expr;
  this.extern = extern;
  this.loc = loc; this.text = text;
  this.rule = rule;
}
/* End AST Node Constructors */

/* Expose the AST Node Constructors */
ast.ProgramNode = ProgramNode;
ast.IntervalStartLiteralNode = IntervalStartLiteralNode;
ast.IntervalEndLiteralNode = IntervalEndLiteralNode;
ast.IntervalNode = IntervalNode;
ast.SimplePositiveUnaryTestNode = SimplePositiveUnaryTestNode;
ast.SimpleUnaryTestsNode = SimpleUnaryTestsNode;
ast.QualifiedNameNode = QualifiedNameNode;
ast.ArithmeticExpressionNode = ArithmeticExpressionNode;
ast.SimpleExpressionsNode = SimpleExpressionsNode;
ast.NameNode = NameNode;
ast.LiteralNode = LiteralNode;
ast.DateTimeLiteralNode = DateTimeLiteralNode;
ast.DecimalNumberNode = DecimalNumberNode;
ast.FunctionInvocationNode = FunctionInvocationNode;
ast.PositionalParametersNode = PositionalParametersNode;
ast.ComparisonExpressionNode = ComparisonExpressionNode;
ast.InExpressionNode = InExpressionNode;
ast.QuantifiedExpressionNode = QuantifiedExpressionNode;
ast.ListNode = ListNode;
ast.LogicalExpressionNode = LogicalExpressionNode;
ast.ForExpressionNode = ForExpressionNode;
ast.IfExpressionNode = IfExpressionNode;
ast.FilterExpressionNode = FilterExpressionNode;
ast.FunctionBodyNode = FunctionBodyNode;
ast.FunctionDefinitionNode = FunctionDefinitionNode;

module.exports = ast;
