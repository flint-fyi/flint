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
			"Reports empty type parameter lists in type aliases and interfaces.",
		id: "emptyTypeParameterLists",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		emptyTypeParameters: {
			primary: "Empty type parameter lists are unnecessary.",
			secondary: [
				"TypeScript permits empty type parameter lists like `<>`, but this practice is discouraged.",
				"Empty type parameter lists can lead to unclear or ambiguous code.",
			],
			suggestions: [
				"Remove the empty type parameter list, or add type parameters if needed.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.InterfaceDeclaration | AST.TypeAliasDeclaration,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (node.typeParameters && !node.typeParameters.length) {
				context.report({
					message: "emptyTypeParameters",
					range: getTSNodeRange(node, sourceFile),
				});
			}
		}
		return {
			visitors: {
				InterfaceDeclaration: checkNode,
				TypeAliasDeclaration: checkNode,
			},
		};
	},
});
