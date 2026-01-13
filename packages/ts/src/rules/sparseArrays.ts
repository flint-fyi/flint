import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports array literals with holes (sparse arrays).",
		id: "sparseArrays",
		preset: "logical",
	},
	messages: {
		noSparseArray: {
			primary:
				'Sparse arrays with "holes" (empty slots) are misleading and behave differently from `undefined` values.',
			secondary: [
				"Array methods treat holes inconsistently, which can lead to unexpected behavior and bugs.",
				"Using explicit `undefined` values makes the intent clear and ensures consistent behavior.",
			],
			suggestions: [
				"Replace holes with explicit `undefined` values.",
				"Remove unintended commas if the holes are accidental.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				OmittedExpression: (node, { sourceFile }) => {
					const parent = node.parent;
					if (parent.kind !== SyntaxKind.ArrayLiteralExpression) {
						return;
					}

					const syntaxList = parent
						.getChildren(sourceFile)
						.find((child) => child.kind === SyntaxKind.SyntaxList);

					if (!syntaxList) {
						return;
					}

					const children = syntaxList.getChildren(sourceFile);
					const omittedIndex = children.indexOf(node);

					for (let i = omittedIndex + 1; i < children.length; i++) {
						const child = nullThrows(
							children[i],
							"Child is expected to be present by the loop condition",
						);
						if (child.kind === SyntaxKind.CommaToken) {
							context.report({
								message: "noSparseArray",
								range: {
									begin: child.getStart(sourceFile),
									end: child.getEnd(),
								},
							});
							break;
						}
					}
				},
			},
		};
	},
});
