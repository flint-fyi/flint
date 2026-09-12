import { SyntaxKind } from "typescript-native/unstable/ast";

import type { FileChange } from "@flint.fyi/core";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { getRuleTesterDescribedCases } from "../utils/getRuleTesterDescribedCases.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Test cases with only a code property can use string shorthand syntax instead of object literal syntax.",
		id: "testShorthands",
		presets: ["logical"],
	},
	messages: {
		testShorthands: {
			primary: "Use string shorthand for test cases with only a code property.",
			secondary: [
				"String shorthand syntax is more concise: `valid: ['code here']` instead of `valid: [{ code: 'code here' }]`.",
				"Object literal syntax should be reserved for test cases with additional properties like fileName or options.",
			],
			suggestions: ["Switch the test case to shorthand syntax."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					const describedCases = getRuleTesterDescribedCases(node);
					if (!describedCases) {
						return;
					}

					for (const testCase of describedCases.valid) {
						const caseNode = testCase.nodes.case;
						if (caseNode.kind !== SyntaxKind.ObjectLiteralExpression) {
							continue;
						}

						const property = caseNode.properties[0];
						if (
							caseNode.properties.length === 1 &&
							property &&
							(property.kind === SyntaxKind.PropertyAssignment ||
								property.kind === SyntaxKind.ShorthandPropertyAssignment) &&
							property.name.kind === SyntaxKind.Identifier &&
							property.name.text === "code"
						) {
							const fix: FileChange | undefined =
								property.kind === SyntaxKind.PropertyAssignment
									? {
											range: getTSNodeRange(caseNode, sourceFile),
											text: property.initializer.getText(sourceFile),
										}
									: undefined;
							context.report({
								fix,
								message: "testShorthands",
								range: getTSNodeRange(property, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
