import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import { unwrapParenthesizedExpression } from "../utils/unwrapParenthesizedExpression.ts";

const operatorStrings = new Map([
	[SyntaxKind.InKeyword, "in"],
	[SyntaxKind.InstanceOfKeyword, "instanceof"],
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports negating the left operand of `in` or `instanceof` relations.",
		id: "unsafeNegations",
		preset: "untyped",
	},
	messages: {
		preferNegatingRelation: {
			primary: "This negation applies before the `{{ operator }}` operator.",
			secondary: [
				"The logical not operator (!) has higher precedence than `in` and `instanceof`.",
				"Write `!(left in right)` or `!(left instanceof Right)` to negate the relation as intended.",
			],
			suggestions: ["Wrap the relation in parentheses and negate it."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					const operator = operatorStrings.get(node.operatorToken.kind);
					if (!operator) {
						return;
					}

					const left = unwrapParenthesizedExpression(node.left);
					if (
						left.kind !== SyntaxKind.PrefixUnaryExpression ||
						left.operator !== SyntaxKind.ExclamationToken
					) {
						return;
					}

					const begin = left.getStart(sourceFile);

					context.report({
						data: { operator },
						message: "preferNegatingRelation",
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
