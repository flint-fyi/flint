import { SyntaxKind } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

export function isInBooleanContext(node: AST.AnyNode): boolean {
	switch (node.parent.kind) {
		case SyntaxKind.AsExpression:
		case SyntaxKind.NonNullExpression:
		case SyntaxKind.ParenthesizedExpression:
			return isInBooleanContext(node.parent);

		case SyntaxKind.BinaryExpression: {
			return (
				node.parent.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
				node.parent.operatorToken.kind === SyntaxKind.BarBarToken
			);
		}

		// TODO: This should make sure the Boolean is the global one...
		case SyntaxKind.CallExpression: {
			return (
				node.parent.expression.kind === SyntaxKind.Identifier &&
				node.parent.expression.text === "Boolean" &&
				node.parent.arguments.length === 1 &&
				node.parent.arguments[0] === node
			);
		}

		case SyntaxKind.ConditionalExpression:
		case SyntaxKind.ForStatement:
			return node.parent.condition === node;

		case SyntaxKind.DoStatement:
		case SyntaxKind.IfStatement:
		case SyntaxKind.WhileStatement:
			return node.parent.expression === node;

		case SyntaxKind.PrefixUnaryExpression:
			return node.parent.operator === SyntaxKind.ExclamationToken;

		default:
			return false;
	}
}
