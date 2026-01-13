import { typescriptLanguage } from "../language.ts";

const withKeyword = "with";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using with statements",
		id: "withStatements",
		presets: ["untyped"],
	},
	messages: {
		withStatement: {
			primary:
				"`with` statements are deprecated, unreliable, and difficult to reason about.",
			secondary: [
				"The with statement is problematic because it adds members of an object to the current scope, making it impossible to tell what a variable inside the block actually refers to.",
				"If an object doesn't have an expected variable, you'll end up modifying a global instead of the expected property.",
			],
			suggestions: [
				"Create a variable with the content of the with expression and access its properties instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				WithStatement: (node) => {
					context.report({
						message: "withStatement",
						range: {
							begin: node.getStart(),
							end: node.getStart() + withKeyword.length,
						},
					});
				},
			},
		};
	},
});
