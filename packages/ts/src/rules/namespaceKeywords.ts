import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `module` keyword instead of `namespace` for TypeScript namespaces.",
		id: "namespaceKeywords",
		presets: ["stylistic", "stylisticStrict"],
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
					if (node.name.kind === SyntaxKind.StringLiteral) {
						return;
					}

					const children = node.getChildren(sourceFile);
					const moduleKeywordToken = children.find(
						(child) => child.kind === SyntaxKind.ModuleKeyword,
					);

					if (!moduleKeywordToken) {
						return;
					}

					const range = getTSNodeRange(moduleKeywordToken, sourceFile);

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
