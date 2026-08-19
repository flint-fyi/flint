import type { Type } from "typescript";

import {
	getStaticStringValue,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";
import {
	SyntaxKind,
	TypeFlags,
} from "@flint.fyi/typescript-language/typescript";

import { ruleCreator } from "./ruleCreator.ts";

const comparisonOperators = new Set([
	SyntaxKind.EqualsEqualsEqualsToken,
	SyntaxKind.EqualsEqualsToken,
	SyntaxKind.ExclamationEqualsEqualsToken,
	SyntaxKind.ExclamationEqualsToken,
]);

function isStringCharAtCall(node: AST.Expression, typeChecker: Checker) {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "charAt" &&
		isStringType(typeChecker.getTypeAtLocation(node.expression.expression))
	);
}

function isStringType(type: Type) {
	return (type.flags & TypeFlags.StringLike) !== 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports comparing charAt() results with strings longer than one character.",
		id: "charAtComparisons",
		presets: ["logical", "logicalStrict"],
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

					const value = getStaticStringValue(literal);
					if (value === undefined || value.length <= 1) {
						return;
					}

					const isEquality =
						node.operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken ||
						node.operatorToken.kind === SyntaxKind.EqualsEqualsToken;

					context.report({
						data: {
							length: value.length,
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
