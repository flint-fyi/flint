import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { getRuleTesterDescribedCases } from "../utils/getRuleTesterDescribedCases.ts";
import type { ParsedTestCase } from "../utils/types.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports test cases that have the same name as a previous test case.",
		id: "testCaseNameDuplicates",
		presets: ["logical"],
	},
	messages: {
		duplicateTestName: {
			primary: "This test name already appeared in a previous test.",
			secondary: [
				"When writing tests for lint rules, it's possible to accidentally give the same name to multiple test cases.",
				"Doing so makes it harder to identify failing tests in test log output.",
			],
			suggestions: [
				"Delete this redundant test case or give it a unique name.",
			],
		},
	},
	setup(context) {
		function checkTestCases(
			testCases: ParsedTestCase[],
			sourceFile: AST.SourceFile,
		) {
			const seen = new Set<string>();

			for (const testCase of testCases) {
				if (testCase.name == undefined || !testCase.nodes.name) {
					continue;
				}

				if (seen.has(testCase.name)) {
					context.report({
						message: "duplicateTestName",
						range: getTSNodeRange(testCase.nodes.name, sourceFile),
					});
				} else {
					seen.add(testCase.name);
				}
			}
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					const describedCases = getRuleTesterDescribedCases(node);
					if (!describedCases) {
						return;
					}

					checkTestCases(describedCases.invalid, sourceFile);
					checkTestCases(describedCases.valid, sourceFile);
				},
			},
		};
	},
});
