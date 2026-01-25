import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { getRuleTesterDescribedCases } from "../getRuleTesterDescribedCases.ts";
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
						if (
							ts.isObjectLiteralExpression(caseNode) &&
							caseNode.properties.length === 1 &&
							caseNode.properties[0]?.name &&
							ts.isIdentifier(caseNode.properties[0].name) &&
							caseNode.properties[0].name.text === "code"
						) {
							context.report({
								message: "testShorthands",
								range: getTSNodeRange(caseNode.properties[0], sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
