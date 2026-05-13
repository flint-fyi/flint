import * as ts from "typescript";

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
export function isInlineArrayCreation(node: ts.Expression) {
	if (ts.isArrayLiteralExpression(node)) {
		return true;
	}

	if (ts.isParenthesizedExpression(node)) {
		return isInlineArrayCreation(node.expression);
	}

	if (ts.isCallExpression(node)) {
		if (ts.isPropertyAccessExpression(node.expression)) {
			const methodName = node.expression.name.text;

			if (
				ts.isIdentifier(node.expression.expression) &&
				node.expression.expression.text === "Object" &&
				objectStaticMethods.has(methodName)
			) {
				return true;
			}

			if (
				ts.isIdentifier(node.expression.expression) &&
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
			ts.isIdentifier(node.expression) &&
			node.expression.text === "Array" &&
			ts.isNewExpression(node.parent)
		) {
			return true;
		}
	}

	if (
		ts.isNewExpression(node) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === "Array"
	) {
		return true;
	}

	return false;
}
