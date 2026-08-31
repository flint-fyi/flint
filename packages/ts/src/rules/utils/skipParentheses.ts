import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function skipParentheses(node: AST.Expression): AST.Expression {
	while (node.kind === SyntaxKind.ParenthesizedExpression) {
		node = node.expression;
	}
	return node;
}
