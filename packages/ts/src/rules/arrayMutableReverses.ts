import {
	isBuiltinArrayMethod,
	isInlineArrayCreation,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `.reverse()` calls on arrays that mutate the original array.",
		id: "arrayMutableReverses",
		presets: ["stylistic"],
	},
	messages: {
		preferToReversed: {
			primary:
				"Use `.toReversed()` instead of `.reverse()` to avoid mutating the original array.",
			secondary: [
				"The `.reverse()` method mutates the array in place.",
				"The `.toReversed()` method returns a new reversed array without modifying the original.",
			],
			suggestions: ["Replace `.reverse()` with `.toReversed()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!isBuiltinArrayMethod("reverse", node, typeChecker) ||
						isInlineArrayCreation(node.expression.expression)
					) {
						return;
					}

					const arrayText = node.expression.expression.getText(sourceFile);

					context.report({
						fix: {
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
							text: `${arrayText}.toReversed()`,
						},
						message: "preferToReversed",
						range: {
							begin: node.expression.name.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
