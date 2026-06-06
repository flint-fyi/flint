import { SyntaxKind } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

export function skipParentheses(node: AST.Expression): AST.Expression {
	while (node.kind === SyntaxKind.ParenthesizedExpression) {
		node = node.expression;
	}
	return node;
}
