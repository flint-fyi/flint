import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallows non-null assertions.",
		id: "nonNullAssertions",
		presets: ["logicalStrict"],
	},
	messages: {
		nonNullAssertion: {
			primary: "Non-null assertions bypass TypeScript's strict null checking.",
			secondary: [
				"The non-null assertion operator (`!`) tells TypeScript to trust that a value is not `null` or `undefined`.",
				"This can mask potential bugs when the value actually is `null` or `undefined` at runtime.",
			],
			suggestions: [
				"Use type guards, nullish coalescing (`??`), or optional chaining (`?.`) instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				NonNullExpression: (node) => {
					const range = {
						begin: node.expression.getEnd(),
						end: node.getEnd(),
					};

					context.report({
						message: "nonNullAssertion",
						range,
					});
				},
			},
		};
	},
});
