import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Program } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	unwrapParenthesizedNode,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

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
		presets: ["logical", "logicalStrict"],
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
				BinaryExpression: (node, { checker, program, sourceFile }) => {
					if (!comparisonOperators.has(node.operatorToken.kind)) {
						return;
					}

					if (
						isNaNIdentifier(node.left, checker, program) ||
						isNaNIdentifier(node.right, checker, program)
					) {
						context.report({
							message: "useIsNaN",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};

		function isNaNIdentifier(
			node: AST.Expression,
			checker: Checker,
			program: Program,
		) {
			const unwrapped = unwrapParenthesizedNode(node);
			return (
				unwrapped.kind === SyntaxKind.Identifier &&
				unwrapped.text === "NaN" &&
				isGlobalDeclarationOfName(unwrapped, "NaN", checker, program)
			);
		}
	},
});
