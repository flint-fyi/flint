import { SyntaxKind } from "typescript";

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
		if (node.expression.kind === SyntaxKind.PropertyAccessExpression) {
			const methodName = node.expression.name.text;

			if (
				node.expression.expression.kind === SyntaxKind.Identifier &&
				node.expression.expression.text === "Object" &&
				objectStaticMethods.has(methodName)
			) {
				return true;
			}

			if (
				node.expression.expression.kind === SyntaxKind.Identifier &&
				node.expression.expression.text === "Array" &&
				(methodName === "from" || methodName === "of")
			) {
				return true;
			}

			if (methodsReturningNewArray.has(methodName)) {
				return true;
			}
		}

		if (
			node.expression.kind === SyntaxKind.Identifier &&
			node.expression.text === "Array" &&
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
