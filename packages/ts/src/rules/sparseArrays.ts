import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getFirstTokenInRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports array literals with holes (sparse arrays).",
		id: "sparseArrays",
		presets: ["logical", "logicalStrict"],
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
					if (node.parent.kind !== SyntaxKind.ArrayLiteralExpression) {
						return;
					}

					context.report({
						message: "noSparseArray",
						range: nullThrows(
							getFirstTokenInRange(sourceFile, node.getStart(sourceFile)),
							"An array literal is expected to start with a token",
						),
					});
				},
			},
		};
	},
});
