import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { getRuleTesterDescribedCases } from "../getRuleTesterDescribedCases.ts";
import type { ParsedTestCaseInvalid } from "../types.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports cases for invalid code that isn't formatted across lines.",
		id: "invalidCodeLines",
		presets: ["logical"],
	},
	messages: {
		singleLineTest: {
			primary:
				"This code block should be formatted across multiple lines for more readable reports.",
			secondary: [
				"When writing `invalid` case code blocks, it's better to start code on a new line in a template literal string.",
				"Doing so allows the case's `snapshot` to visualize the `~` characters visually underneath reported ranges.",
			],
			suggestions: [
				"Delete this redundant test case.",
				"Change a property to make the test case unique.",
			],
		},
	},
	setup(context) {
		function checkTestCase(
			testCase: ParsedTestCaseInvalid,
			sourceFile: AST.SourceFile,
		) {
			if (!testCase.code.endsWith("\n") || !testCase.code.startsWith("\n")) {
				context.report({
					fix: [
						createFixForCode(testCase, sourceFile),
						createFixForSnapshot(testCase, sourceFile),
					],
					message: "singleLineTest",
					range: getTSNodeRange(testCase.nodes.code, sourceFile),
				});
			}
		}

		function createFixForCode(
			testCase: ParsedTestCaseInvalid,
			sourceFile: AST.SourceFile,
		) {
			return {
				range: getTSNodeRange(testCase.nodes.code, sourceFile),
				text: `\`\n${testCase.code.trim()}\n\``,
			};
		}

		function createFixForSnapshot(
			testCase: ParsedTestCaseInvalid,
			sourceFile: AST.SourceFile,
		) {
			return {
				range: getTSNodeRange(testCase.nodes.snapshot, sourceFile),
				text: `\`\n${testCase.snapshot.trim()}\n\``,
			};
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					const describedCases = getRuleTesterDescribedCases(node);
					if (!describedCases) {
						return;
					}

					describedCases.invalid.forEach((testCase) => {
						checkTestCase(testCase, sourceFile);
					});
				},
			},
		};
	},
});
