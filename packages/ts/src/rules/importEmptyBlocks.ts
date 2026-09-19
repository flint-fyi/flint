import { createScanner, SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports empty named import blocks.",
		id: "importEmptyBlocks",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noEmptyNamedBlocksOnly: {
			primary: "Empty named import blocks are unnecessary.",
			secondary: [
				"An empty `{ }` in an import statement has no effect and can be removed.",
			],
			suggestions: [
				"Remove the entire import statement.",
				"Convert to a side-effect only import.",
			],
		},
		noEmptyNamedBlocksWithOther: {
			primary: "Empty named import blocks are unnecessary.",
			secondary: [
				"An empty `{ }` in an import statement has no effect and can be removed.",
			],
			suggestions: ["Remove the empty block."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ImportDeclaration: (node, { sourceFile }) => {
					if (
						node.importClause?.namedBindings?.kind !==
							SyntaxKind.NamedImports ||
						node.importClause.namedBindings.elements.length
					) {
						return;
					}

					if (!node.importClause.name) {
						context.report({
							fix: {
								range: getTSNodeRange(node, sourceFile),
								text: `import ${node.moduleSpecifier.getText(sourceFile)};`,
							},
							message: "noEmptyNamedBlocksOnly",
							range: getTSNodeRange(
								node.importClause.namedBindings,
								sourceFile,
							),
						});
					}

					const begin = node.importClause.name?.getEnd();
					if (begin === undefined) {
						return;
					}

					const scanner = createScanner(
						true,
						sourceFile.languageVariant,
						sourceFile.text,
						begin,
						node.importClause.namedBindings.getStart(sourceFile) - begin,
					);
					if (scanner.scan() !== SyntaxKind.CommaToken) {
						return;
					}

					context.report({
						fix: {
							range: {
								begin: scanner.getTokenStart(),
								end: node.importClause.namedBindings.getEnd(),
							},
							text: "",
						},
						message: "noEmptyNamedBlocksWithOther",
						range: getTSNodeRange(node.importClause.namedBindings, sourceFile),
					});
				},
			},
		};
	},
});
