import { typescriptLanguage } from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `module` keyword instead of `namespace` for TypeScript namespaces.",
		id: "namespaceKeywords",
		presets: ["stylistic"],
	},
	messages: {
		preferNamespace: {
			primary:
				"The `namespace` keyword is preferred over `module` for TypeScript namespaces.",
			secondary: [
				"TypeScript originally used the `module` keyword to declare internal modules (namespaces).",
				"The `namespace` keyword was later introduced to avoid confusion with ES6 modules.",
				"Using `namespace` makes it clear you are defining a TypeScript namespace, not an ES6 module.",
			],
			suggestions: ["Replace `module` with `namespace`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ModuleDeclaration: (node, { sourceFile }) => {
					// Skip if the name is a string literal (e.g., `module "name" {}`)
					// String literals indicate external/ambient module declarations, not namespaces
					if (node.name.kind === SyntaxKind.StringLiteral) {
						return;
					}

					// Find the module keyword token by searching through children
					const children = node.getChildren(sourceFile);
					const moduleKeywordToken = children.find(
						(child): child is ts.Token<SyntaxKind.ModuleKeyword> =>
							child.kind === SyntaxKind.ModuleKeyword,
					);

					if (!moduleKeywordToken) {
						return;
					}

					const range = {
						begin: moduleKeywordToken.getStart(sourceFile),
						end: moduleKeywordToken.getEnd(),
					};

					context.report({
						fix: {
							range,
							text: "namespace",
						},
						message: "preferNamespace",
						range,
					});
				},
			},
		};
	},
});
