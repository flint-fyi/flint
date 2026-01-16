import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using legacy `namespace` declarations.",
		id: "namespaceDeclarations",
		presets: ["logical"],
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
						tsutils.includesModifier(
							node.modifiers as ts.NodeArray<ts.ModifierLike>,
							SyntaxKind.DeclareKeyword,
						)
					) {
						return;
					}

					context.report({
						message: "preferModules",
						range: getTSNodeRange(node.getChildAt(0), sourceFile),
					});
				},
			},
		};
	},
});
