import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

export function skipParentheses(node: AST.Expression): AST.Expression {
	while (node.kind == SyntaxKind.ParenthesizedExpression) {
		node = node.expression;
	}
	return node;
}
