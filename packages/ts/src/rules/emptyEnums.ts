import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports empty enum declarations with no members.",
		id: "emptyEnums",
		presets: ["logical"],
	},
	messages: {
		emptyEnum: {
			primary: "Empty enums serve no purpose.",
			secondary: [
				"An enum with no members cannot be used to represent any values.",
				"Empty enums are typically the result of incomplete implementation or mistaken deletion.",
			],
			suggestions: [
				"Add members to the enum to define valid values.",
				"Remove the empty enum if it is no longer needed.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				EnumDeclaration: (node, { sourceFile }) => {
					if (node.members.length === 0) {
						context.report({
							message: "emptyEnum",
							range: {
								begin: node.getStart(sourceFile),
								end: node.name.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
