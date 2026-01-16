import {
	hasSameTokens,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isComparisonOperator } from "./utils/operators.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports comparing a value to itself.",
		id: "selfComparisons",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noSelfComparison: {
			primary:
				"Comparing a value to itself is unnecessary and likely indicates a logic error.",
			secondary: [
				"Self-comparisons always evaluate to the same result for a given operator.",
				"This pattern often indicates a copy-paste error or typo where different variables were intended.",
			],
			suggestions: [
				"Verify that you intended to compare two different values.",
				"If checking for NaN, use `Number.isNaN()` or `isNaN()` instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						isComparisonOperator(node.operatorToken) &&
						hasSameTokens(node.left, node.right, sourceFile)
					) {
						context.report({
							message: "noSelfComparison",
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
