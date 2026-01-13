import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using the void operator.",
		id: "voidOperator",
		presets: ["stylistic"],
	},
	messages: {
		noVoid: {
			primary:
				"Prefer an explicit value over using the void operator to produce undefined.",
			secondary: [
				"The void operator evaluates an expression and returns undefined, regardless of the expression's value.",
				"This is often confusing and can be replaced with more explicit code.",
				"Instead of using void, return or assign undefined directly.",
			],
			suggestions: [
				"Replace void expressions with undefined or restructure the code to be more explicit.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VoidExpression: (node, { sourceFile }) => {
					context.report({
						message: "noVoid",
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
