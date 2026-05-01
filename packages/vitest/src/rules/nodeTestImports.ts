import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports importing from `node:test`.",
		id: "nodeTestImports",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		nodeTestImport: {
			primary: "This `node:test` import will not work when using Vitest.",
			secondary: [
				"Test runners such as `node:test` and Vitest are not cross-compatible.",
				"You can't import from one test runner when using another.",
				"Importing from `node:test` in a project that uses Vitest is probably a mistake.",
			],
			suggestions: [
				"Remove this erroneous import.",
				"Switch this import to `vitest`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ImportDeclaration: (node, { sourceFile }) => {
					if (
						node.moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral ||
						node.moduleSpecifier.text !== "node:test"
					) {
						return;
					}

					const range = getTSNodeRange(node.moduleSpecifier, sourceFile);

					context.report({
						fix: [
							{
								range: {
									begin: range.begin + 1,
									end: range.end - 1,
								},
								text: "vitest",
							},
						],
						message: "nodeTestImport",
						range,
					});
				},
			},
		};
	},
});
