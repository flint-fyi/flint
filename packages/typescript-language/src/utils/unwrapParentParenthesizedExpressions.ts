import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";

export function unwrapParentParenthesizedExpressions(
	node: AST.BinaryExpression | AST.ParenthesizedExpression,
): AST.LeftHandSideExpressionParent {
	return node.parent.kind === SyntaxKind.ParenthesizedExpression
		? unwrapParentParenthesizedExpressions(node.parent)
		: (node.parent as AST.LeftHandSideExpressionParent);
}
