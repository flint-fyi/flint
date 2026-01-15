import {
	type AST,
	type Checker,
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	unwrapParenthesizedExpression,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const comparisonOperators = new Set([
	SyntaxKind.EqualsEqualsEqualsToken,
	SyntaxKind.EqualsEqualsToken,
	SyntaxKind.ExclamationEqualsEqualsToken,
	SyntaxKind.ExclamationEqualsToken,
	SyntaxKind.GreaterThanEqualsToken,
	SyntaxKind.GreaterThanToken,
	SyntaxKind.LessThanEqualsToken,
	SyntaxKind.LessThanToken,
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports comparisons with NaN, which should use Number.isNaN() instead.",
		id: "isNaNComparisons",
		presets: ["logical"],
	},
	messages: {
		useIsNaN: {
			primary: "Use `Number.isNaN()` instead of comparing with `NaN`.",
			secondary: [
				"`NaN` is not equal to anything, including itself, so comparisons with `NaN` always return `false`.",
			],
			suggestions: ["Use `Number.isNaN(value)` for reliable NaN detection."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					if (!comparisonOperators.has(node.operatorToken.kind)) {
						return;
					}

					if (
						isNaNIdentifier(node.left, typeChecker) ||
						isNaNIdentifier(node.right, typeChecker)
					) {
						context.report({
							message: "useIsNaN",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};

		function isNaNIdentifier(node: AST.Expression, typeChecker: Checker) {
			const unwrapped = unwrapParenthesizedExpression(node);
			return (
				unwrapped.kind === SyntaxKind.Identifier &&
				unwrapped.text === "NaN" &&
				isGlobalDeclarationOfName(unwrapped, "NaN", typeChecker)
			);
		}
	},
});
