import { SyntaxKind } from "typescript";

import * as AST from "../../types/ast.ts";

export function skipParentheses(node: AST.Expression): AST.Expression {
	while (node.kind == SyntaxKind.ParenthesizedExpression) {
		node = node.expression;
	}
	return node;
}
