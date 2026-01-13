import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports empty named import blocks.",
		id: "importEmptyBlocks",
		preset: "logical",
	},
	messages: {
		noEmptyNamedBlocks: {
			primary: "Empty named import blocks are unnecessary.",
			secondary: [
				"An empty `{ }` in an import statement has no effect and should be removed.",
			],
			suggestions: ["Remove the empty block, or add the imports you need."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ImportDeclaration: (node, { sourceFile }) => {
					const importClause = node.importClause;
					if (!importClause) {
						return;
					}

					const namedBindings = importClause.namedBindings;
					if (!namedBindings) {
						return;
					}

					// Check for empty named imports: import { } from "mod"
					if (
						ts.isNamedImports(namedBindings) &&
						namedBindings.elements.length === 0
					) {
						context.report({
							message: "noEmptyNamedBlocks",
							range: getTSNodeRange(namedBindings, sourceFile),
						});
					}
				},
			},
		};
	},
});
