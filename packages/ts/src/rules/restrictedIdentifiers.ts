import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const denylist = new Set(["callback", "cb", "data", "e", "err"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallows specific identifier names in binding positions.",
		id: "restrictedIdentifiers",
		presets: ["stylisticStrict"],
	},
	messages: {
		restrictedIdentifier: {
			primary: "Identifier '{{ name }}' is restricted.",
			secondary: [
				"This identifier name is on the denylist. Consider using a more descriptive name.",
			],
			suggestions: ["Rename the identifier to something more specific."],
		},
	},
	setup(context) {
		const reportIfRestricted = (
			identifier: ts.Identifier,
			sourceFile: ts.SourceFile,
		) => {
			const name = identifier.text;

			if (!denylist.has(name)) {
				return;
			}

			context.report({
				data: { name },
				message: "restrictedIdentifier",
				range: {
					begin: identifier.getStart(sourceFile),
					end: identifier.getEnd(),
				},
			});
		};

		return {
			visitors: {
				ClassDeclaration: (node, { sourceFile }) => {
					if (node.name) {
						reportIfRestricted(node.name, sourceFile);
					}
				},
				FunctionDeclaration: (node, { sourceFile }) => {
					if (node.name) {
						reportIfRestricted(node.name, sourceFile);
					}
				},
				ImportClause: (node, { sourceFile }) => {
					if (node.name) {
						reportIfRestricted(node.name, sourceFile);
					}
				},
				ImportSpecifier: (node, { sourceFile }) => {
					reportIfRestricted(node.name, sourceFile);
				},
				NamespaceImport: (node, { sourceFile }) => {
					reportIfRestricted(node.name, sourceFile);
				},
				Parameter: (node, { sourceFile }) => {
					if (ts.isIdentifier(node.name)) {
						reportIfRestricted(node.name, sourceFile);
					}
				},
				VariableDeclaration: (node, { sourceFile }) => {
					if (ts.isIdentifier(node.name)) {
						reportIfRestricted(node.name, sourceFile);
					}
				},
			},
		};
	},
});
