import { SyntaxKind } from "typescript-native/unstable/ast";
import { z } from "zod/v4";

import {
	getFirstTokenInRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using legacy `namespace` declarations.",
		id: "namespaceDeclarations",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferModules: {
			primary:
				"Prefer using ECMAScript modules over legacy TypeScript namespaces.",
			secondary: [
				"Namespaces are a legacy feature of TypeScript that can lead to confusion and are not compatible with ECMAScript modules.",
			],
			suggestions: [
				"Modern codebases generally use `export` and `import` statements to define and use ECMAScript modules instead.",
			],
		},
	},
	options: {
		allowDeclarations: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow namespaces declared with the `declare` keyword.",
			),
		allowDefinitionFiles: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow namespaces in `.d.ts` and other definition files.",
			),
	},
	setup(context) {
		return {
			visitors: {
				ModuleDeclaration: (
					node,
					{ options: { allowDeclarations, allowDefinitionFiles }, sourceFile },
				) => {
					if (allowDefinitionFiles && sourceFile.isDeclarationFile) {
						return;
					}

					if (
						node.parent.kind !== SyntaxKind.SourceFile ||
						node.name.kind !== SyntaxKind.Identifier ||
						node.name.text === "global"
					) {
						return;
					}

					if (
						allowDeclarations &&
						node.modifiers?.some(
							(modifier) => modifier.kind === SyntaxKind.DeclareKeyword,
						)
					) {
						return;
					}

					const begin = node.getStart(sourceFile);
					context.report({
						message: "preferModules",
						range: nullThrows(
							getFirstTokenInRange(sourceFile, begin, node.getEnd()),
							"A namespace declaration is expected to start with a token",
						),
					});
				},
			},
		};
	},
});
