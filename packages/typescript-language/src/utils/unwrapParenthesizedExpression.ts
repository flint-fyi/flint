import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";

export function unwrapParenthesizedExpression(
	expression: AST.ConciseBody | AST.Expression,
): AST.ConciseBody | AST.Expression {
	return expression.kind === SyntaxKind.ParenthesizedExpression
		? unwrapParenthesizedExpression(expression.expression)
		: expression;
}
