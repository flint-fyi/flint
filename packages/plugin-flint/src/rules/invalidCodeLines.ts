import { getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import ts, { SyntaxKind } from "typescript";

import { getRuleTesterDescribedCases } from "../getRuleTesterDescribedCases.ts";
import type { ParsedTestCaseInvalid } from "../types.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports cases for invalid code that isn't formatted across lines.",
		id: "invalidCodeLines",
		preset: "logical",
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
			sourceFile: ts.SourceFile,
		) {
			if (!testCase.code.startsWith("\n")) {
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
			sourceFile: ts.SourceFile,
		) {
			if (testCase.nodes.code.kind === SyntaxKind.StringLiteral) {
				return {
					range: getTSNodeRange(testCase.nodes.code, sourceFile),
					text: `\`\n${testCase.code}\n\``,
				};
			}

			const begin = testCase.nodes.code.getStart(sourceFile) + 1;

			return {
				range: {
					begin,
					end: begin,
				},
				text: "\n",
			};
		}

		function createFixForSnapshot(
			testCase: ParsedTestCaseInvalid,
			sourceFile: ts.SourceFile,
		) {
			const begin = testCase.nodes.snapshot.getStart(sourceFile) + 1;

			return {
				range: {
					begin,
					end: begin,
				},
				text: "\n",
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
