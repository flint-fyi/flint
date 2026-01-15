import {
	typescriptLanguage,
	unwrapParenthesizedExpression,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const equalityOperators = new Set([
	SyntaxKind.EqualsEqualsEqualsToken,
	SyntaxKind.EqualsEqualsToken,
	SyntaxKind.ExclamationEqualsEqualsToken,
	SyntaxKind.ExclamationEqualsToken,
]);

const operatorStrings = new Map([
	[SyntaxKind.EqualsEqualsEqualsToken, "==="],
	[SyntaxKind.EqualsEqualsToken, "=="],
	[SyntaxKind.ExclamationEqualsEqualsToken, "!=="],
	[SyntaxKind.ExclamationEqualsToken, "!="],
]);

const negatedOperators = new Map([
	[SyntaxKind.EqualsEqualsEqualsToken, "!=="],
	[SyntaxKind.EqualsEqualsToken, "!="],
	[SyntaxKind.ExclamationEqualsEqualsToken, "==="],
	[SyntaxKind.ExclamationEqualsToken, "=="],
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports negated expressions on the left side of equality checks.",
		id: "equalityOperatorNegations",
	},
	messages: {
		negatedEquality: {
			primary:
				"Negating the left operand of '{{ operator }}' is likely a mistake.",
			secondary: [
				"The logical not operator (!) applies to the left operand before the equality comparison.",
				"This converts the left operand to a boolean before comparing, which is rarely intended.",
			],
			suggestions: [
				"Use the opposite equality operator ('{{ suggested }}') and remove the negation.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (!equalityOperators.has(node.operatorToken.kind)) {
						return;
					}

					const left = unwrapParenthesizedExpression(node.left);
					if (
						left.kind !== SyntaxKind.PrefixUnaryExpression ||
						left.operator !== SyntaxKind.ExclamationToken
					) {
						return;
					}

					const innerExpression = unwrapParenthesizedExpression(left.operand);
					if (
						innerExpression.kind === SyntaxKind.PrefixUnaryExpression &&
						innerExpression.operator === SyntaxKind.ExclamationToken
					) {
						return;
					}

					const begin = left.getStart(sourceFile);

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const operator = operatorStrings.get(node.operatorToken.kind)!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const suggested = negatedOperators.get(node.operatorToken.kind)!;

					context.report({
						data: { operator, suggested },
						message: "negatedEquality",
						range: {
							begin,
							end: begin + 1,
						},
					});
				},
			},
		};
	},
});
