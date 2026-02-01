import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Renames that don't change the identifier name are unnecessary and should use shorthand syntax instead.",
		id: "unnecessaryRenames",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryRename: {
			primary: "Renaming to the same identifier name is unnecessary.",
			secondary: [
				"Using the same name for both the source and target is redundant.",
				"Remove the rename and use the shorthand syntax instead.",
			],
			suggestions: ["Remove the unnecessary rename."],
		},
	},
	setup(context) {
		function checkUnnecessaryRename(
			node: AST.BindingElement | AST.ExportSpecifier | AST.ImportSpecifier,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (
				node.propertyName &&
				ts.isIdentifier(node.propertyName) &&
				ts.isIdentifier(node.name) &&
				node.propertyName.text === node.name.text
			) {
				context.report({
					fix: {
						range: getTSNodeRange(node, sourceFile),
						text: node.name.text,
					},
					message: "unnecessaryRename",
					range: getTSNodeRange(node, sourceFile),
				});
			}
		}

		return {
			visitors: {
				BindingElement: checkUnnecessaryRename,
				ExportSpecifier: checkUnnecessaryRename,
				ImportSpecifier: checkUnnecessaryRename,
			},
		};
	},
});
