import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";
import { unwrapParenthesizedExpression } from "../utils/unwrapParenthesizedExpression.ts";

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

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports comparisons with NaN, which should use Number.isNaN() instead.",
		id: "isNaNComparisons",
		preset: "logical",
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

					const left = unwrapParenthesizedExpression(node.left);
					const right = unwrapParenthesizedExpression(node.right);

					const isNaNComparison =
						isNaNIdentifier(left, typeChecker) ||
						isNaNIdentifier(right, typeChecker);

					if (isNaNComparison) {
						context.report({
							message: "useIsNaN",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};

		function isNaNIdentifier(
			node: ReturnType<typeof unwrapParenthesizedExpression>,
			typeChecker: Parameters<
				Parameters<typeof typescriptLanguage.createRule>[0]["setup"]
			>[0] extends { typeChecker: infer T }
				? T
				: never,
		): boolean {
			if (node.kind !== SyntaxKind.Identifier) {
				return false;
			}

			if (node.text !== "NaN") {
				return false;
			}

			return isGlobalDeclarationOfName(node, "NaN", typeChecker);
		}
	},
});
