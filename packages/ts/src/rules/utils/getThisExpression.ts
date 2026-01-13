import { SyntaxKind } from "typescript";

import * as AST from "../../types/ast.ts";

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

function skipParentheses(node: AST.Expression): AST.Expression {
	while (node.kind == SyntaxKind.ParenthesizedExpression) {
		node = node.expression;
	}
	return node;
}
