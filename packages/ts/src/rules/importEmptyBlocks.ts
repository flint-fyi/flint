import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports empty named import blocks.",
		id: "importEmptyBlocks",
		presets: ["logical"],
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
						!node.importClause?.namedBindings ||
						!ts.isNamedImports(node.importClause.namedBindings) ||
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

					const commaToken = node.importClause
						.getChildren(sourceFile)
						.find((child) => child.kind === ts.SyntaxKind.CommaToken);

					if (!commaToken) {
						return;
					}

					context.report({
						fix: {
							range: {
								begin: commaToken.getStart(sourceFile),
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
