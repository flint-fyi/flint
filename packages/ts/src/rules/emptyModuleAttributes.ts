import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty import/export attributes that serve no purpose.",
		id: "emptyModuleAttributes",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		emptyAttributes: {
			primary:
				"Empty import attributes serve no purpose and should be removed.",
			secondary: [
				"An empty `with {}` or `assert {}` clause provides no additional information about the import.",
				"Remove the empty attributes clause or add the intended attributes.",
			],
			suggestions: ["Remove the empty attributes clause."],
		},
	},
	setup(context) {
		function checkNode(
			{ attributes }: AST.ExportDeclaration | AST.ImportDeclaration,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (attributes && !attributes.elements.length) {
				context.report({
					fix: {
						range: getTSNodeRange(attributes, sourceFile),
						text: "",
					},
					message: "emptyAttributes",
					range: getTSNodeRange(attributes, sourceFile),
				});
			}
		}

		return {
			visitors: {
				ExportDeclaration: checkNode,
				ImportDeclaration: checkNode,
			},
		};
	},
});
