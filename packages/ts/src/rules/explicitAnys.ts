import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports explicit uses of the any type.",
		id: "explicitAnys",
		presets: ["logical"],
	},
	messages: {
		noExplicitAny: {
			primary:
				"Avoid using the any type as it disables type checking for the annotated value.",
			secondary: [
				"Using any defeats the purpose of TypeScript's type system.",
				"It allows any operation on the value without compile-time checks.",
				"Errors that could be caught at compile time may only appear at runtime.",
			],
			suggestions: [
				"Use unknown instead if you need to accept any value but want type safety.",
				"Use a more specific type if the possible values are known.",
				"Use generics to preserve type information across function calls.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				AnyKeyword: (node, { sourceFile }) => {
					context.report({
						message: "noExplicitAny",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
