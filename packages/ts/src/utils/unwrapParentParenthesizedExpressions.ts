import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";

export function unwrapParenthesizedExpressionsParent(
	node: AST.BinaryExpression | AST.ParenthesizedExpression,
): AST.LeftHandSideExpressionParent {
	return node.parent.kind === SyntaxKind.ParenthesizedExpression
		? unwrapParenthesizedExpressionsParent(node.parent)
		: node.parent;
}
