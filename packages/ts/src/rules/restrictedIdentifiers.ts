import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";
import z from "zod/v4";

import { ruleCreator } from "./ruleCreator.ts";

interface Options {
	deny?: string[] | undefined;
}

interface VisitorServices extends TypeScriptFileServices {
	options: Options;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallows specific identifier names in binding positions.",
		id: "restrictedIdentifiers",
		presets: ["stylisticStrict"],
	},
	messages: {
		restricted: {
			primary: "Identifier '{{ name }}' is restricted.",
			secondary: ["This identifier name is on this project's denylist."],
			suggestions: [
				"Rename the identifier to something allowed in the project.",
			],
		},
	},
	options: {
		deny: z.array(z.string()).optional(),
	},
	setup(context) {
		function checkNode(
			node: AST.AnyNode & { name?: AST.BindingName | undefined },
			{ options, sourceFile }: VisitorServices,
		) {
			if (
				node.name?.kind !== ts.SyntaxKind.Identifier ||
				!options.deny?.includes(node.name.text)
			) {
				return;
			}

			context.report({
				data: { name: node.name.text },
				message: "restricted",
				range: getTSNodeRange(node.name, sourceFile),
			});
		}

		return {
			visitors: {
				ClassDeclaration: checkNode,
				FunctionDeclaration: checkNode,
				ImportClause: checkNode,
				ImportSpecifier: checkNode,
				NamespaceImport: checkNode,
				Parameter: checkNode,
				VariableDeclaration: checkNode,
			},
		};
	},
});
