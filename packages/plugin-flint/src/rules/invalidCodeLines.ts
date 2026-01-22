import type { FileChange } from "@flint.fyi/core";
import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

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
			const fix = [
				...createNewlineFixes(testCase.code, testCase.nodes.code, sourceFile),
				...createNewlineFixes(
					testCase.snapshot,
					testCase.nodes.snapshot,
					sourceFile,
				),
			];

			if (fix.length) {
				context.report({
					fix,
					message: "singleLineTest",
					range: getTSNodeRange(testCase.nodes.code, sourceFile),
				});
			}
		}

		function createNewlineFixes(
			code: string,
			node: AST.NoSubstitutionTemplateLiteral | AST.StringLiteral,
			sourceFile: AST.SourceFile,
		) {
			if (node.kind === ts.SyntaxKind.StringLiteral) {
				return [
					{
						range: getTSNodeRange(node, sourceFile),
						text: `\`\n${code}\n\``,
					},
				];
			}

			const changes: FileChange[] = [];

			if (!code.startsWith("\n")) {
				changes.push({
					range: {
						begin: node.getStart(sourceFile) + 1,
						end: node.getStart(sourceFile) + 1,
					},
					text: "\n",
				});
			}

			if (!code.endsWith("\n")) {
				changes.push({
					range: {
						begin: node.getEnd() - 1,
						end: node.getEnd() - 1,
					},
					text: "\n",
				});
			}

			return changes;
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
