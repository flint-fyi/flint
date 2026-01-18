import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
	unwrapParenthesizedExpression,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const looseEqualityOperators = new Set([
	SyntaxKind.EqualsEqualsToken,
	SyntaxKind.ExclamationEqualsToken,
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports loose equality comparisons with null, which match both null and undefined.",
		id: "nullComparisons",
		presets: ["logical"],
	},
	messages: {
		useStrictEquality: {
			primary: "Use strict equality (`===` or `!==`) when comparing with null.",
			secondary: [
				"Loose equality with null (`== null` or `!= null`) matches both `null` and `undefined`.",
			],
			suggestions: ["Use `=== null` or `!== null` for explicit null checks."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (!looseEqualityOperators.has(node.operatorToken.kind)) {
						return;
					}

					if (isNullLiteral(node.left) || isNullLiteral(node.right)) {
						context.report({
							message: "useStrictEquality",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};

		function isNullLiteral(node: AST.Expression) {
			const unwrapped = unwrapParenthesizedExpression(node);
			return unwrapped.kind === SyntaxKind.NullKeyword;
		}
	},
});
