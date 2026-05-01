import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import {
	isNullishLiteral,
	toEqualityOperator,
	toStrictOperator,
} from "./utils/equalityOperators.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforces consistent use of strict equality operators (=== and !==) over loose equality operators (== and !=) for non-nullish comparisons.",
		id: "equalityOperators",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferStrictEquality: {
			primary:
				"Use the more precise strict equality ('{{ strictOperator }}') instead of the loose '{{ looseOperator }}'.",
			secondary: [
				"The loose equality operators '=='/'!=' perform arcane type coercion and are difficult to reason about.",
				"Use strict equality operators '==='/'!==' instead.",
			],
			suggestions: [
				"Replace '{{ looseOperator }}' with '{{ strictOperator }}'.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					const operator = toEqualityOperator(node.operatorToken.kind);
					if (operator == null) {
						return;
					}

					if (isNullishLiteral(node.left) || isNullishLiteral(node.right)) {
						// Skip nullish comparisons - those are handled by the nullishCheckStyle rule
						return;
					}

					const isLooseComparison = operator === "==" || operator === "!=";

					if (isLooseComparison) {
						const strictOperator = toStrictOperator(operator);
						const operatorRange = getTSNodeRange(
							node.operatorToken,
							sourceFile,
						);
						context.report({
							data: {
								looseOperator: operator,
								strictOperator,
							},
							message: "preferStrictEquality",
							range: operatorRange,
							suggestions: [
								{
									id: "useStrictOperator",
									range: operatorRange,
									text: strictOperator,
								},
							],
						});
					}
				},
			},
		};
	},
});
