import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { skipParentheses } from "./skipParentheses.ts";

export function getThisExpression(
	node: AST.Expression,
): AST.ThisExpression | null {
	while (true) {
		node = skipParentheses(node);
		if (
			node.kind == SyntaxKind.CallExpression ||
			node.kind == SyntaxKind.PropertyAccessExpression ||
			node.kind == SyntaxKind.ElementAccessExpression
		) {
			node = node.expression;
		} else if (node.kind == SyntaxKind.ThisKeyword) {
			return node;
		} else {
			break;
		}
	}

	return null;
}
