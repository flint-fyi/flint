import * as ts from "typescript";

import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

const comparisonOperators = new Set([
	ts.SyntaxKind.EqualsEqualsEqualsToken,
	ts.SyntaxKind.EqualsEqualsToken,
	ts.SyntaxKind.ExclamationEqualsEqualsToken,
	ts.SyntaxKind.ExclamationEqualsToken,
]);

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getStringLiteralLength(node: AST.Expression) {
	return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
		? node.text.length
		: undefined;
}

function isStringCharAtCall(node: AST.Expression, typeChecker: Checker) {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		node.expression.name.text === "charAt" &&
		isStringType(typeChecker.getTypeAtLocation(node.expression.expression))
	);
}

function isStringType(type: ts.Type) {
	return (type.flags & ts.TypeFlags.StringLike) !== 0;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports comparing charAt() results with strings longer than one character.",
		id: "charAtComparisons",
		preset: "logical",
	},
	messages: {
		invalidComparison: {
			primary:
				"Comparing charAt() result with a string of length {{ length }} is always {{ result }}.",
			secondary: [
				"The `charAt` method returns a string of exactly one character.",
				"Comparing it with a multi-character string will always evaluate to the same result.",
			],
			suggestions: [
				"Use a single-character string for the comparison.",
				"Consider using `startsWith()`, `includes()`, or `slice()` for multi-character comparisons.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					if (!comparisonOperators.has(node.operatorToken.kind)) {
						return;
					}

					let literal: AST.Expression;

					if (isStringCharAtCall(node.left, typeChecker)) {
						literal = node.right;
					} else if (isStringCharAtCall(node.right, typeChecker)) {
						literal = node.left;
					} else {
						return;
					}

					const length = getStringLiteralLength(literal);
					if (length === undefined || length <= 1) {
						return;
					}

					const isEquality =
						node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
						node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken;

					context.report({
						data: {
							length,
							result: isEquality ? "false" : "true",
						},
						message: "invalidComparison",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
