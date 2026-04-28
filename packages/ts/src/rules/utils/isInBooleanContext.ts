import type { AST } from "@flint.fyi/typescript-language";
import ts from "typescript";

export function isInBooleanContext(node: AST.AnyNode): boolean {
	switch (node.parent.kind) {
		case ts.SyntaxKind.AsExpression:
		case ts.SyntaxKind.NonNullExpression:
		case ts.SyntaxKind.ParenthesizedExpression:
			return isInBooleanContext(node.parent);

		case ts.SyntaxKind.BinaryExpression: {
			return (
				node.parent.operatorToken.kind ===
					ts.SyntaxKind.AmpersandAmpersandToken ||
				node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken
			);
		}

		// TODO: This should make sure the Boolean is the global one...
		case ts.SyntaxKind.CallExpression: {
			return (
				ts.isIdentifier(node.parent.expression) &&
				node.parent.expression.text === "Boolean" &&
				node.parent.arguments.length === 1 &&
				node.parent.arguments[0] === node
			);
		}

		case ts.SyntaxKind.ConditionalExpression:
		case ts.SyntaxKind.ForStatement:
			return node.parent.condition === node;

		case ts.SyntaxKind.DoStatement:
		case ts.SyntaxKind.IfStatement:
		case ts.SyntaxKind.WhileStatement:
			return node.parent.expression === node;

		case ts.SyntaxKind.PrefixUnaryExpression:
			return node.parent.operator === ts.SyntaxKind.ExclamationToken;

		default:
			return false;
	}
}
