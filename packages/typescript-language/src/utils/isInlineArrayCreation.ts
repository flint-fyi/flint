import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";

const methodsReturningNewArray = new Set([
	"concat",
	"entries",
	"filter",
	"flat",
	"flatMap",
	"from",
	"keys",
	"map",
	"of",
	"slice",
	"split",
	"values",
]);

const objectStaticMethods = new Set(["entries", "keys", "values"]);

/**
 * Checks if a node represents an inline array creation expression.
 * These are cases where a new array is created immediately before the method call,
 * so mutating methods like .sort() or .reverse() are safe to use.
 */
export function isInlineArrayCreation(node: AST.Expression): boolean {
	if (node.kind === SyntaxKind.ArrayLiteralExpression) {
		return true;
	}

	if (node.kind === SyntaxKind.ParenthesizedExpression) {
		return isInlineArrayCreation(node.expression);
	}

	if (node.kind === SyntaxKind.CallExpression) {
		const callExpression = node;
		if (
			callExpression.expression.kind === SyntaxKind.PropertyAccessExpression
		) {
			const propertyAccess = callExpression.expression;
			const methodName = propertyAccess.name.text;

			if (
				propertyAccess.expression.kind === SyntaxKind.Identifier &&
				propertyAccess.expression.text === "Object" &&
				objectStaticMethods.has(methodName)
			) {
				return true;
			}

			if (
				propertyAccess.expression.kind === SyntaxKind.Identifier &&
				propertyAccess.expression.text === "Array" &&
				(methodName === "from" || methodName === "of")
			) {
				return true;
			}

			if (methodsReturningNewArray.has(methodName)) {
				return true;
			}
		}

		if (
			callExpression.expression.kind === SyntaxKind.Identifier &&
			callExpression.expression.text === "Array" &&
			node.parent.kind === SyntaxKind.NewExpression
		) {
			return true;
		}
	}

	if (
		node.kind === SyntaxKind.NewExpression &&
		node.expression.kind === SyntaxKind.Identifier &&
		node.expression.text === "Array"
	) {
		return true;
	}

	return false;
}
