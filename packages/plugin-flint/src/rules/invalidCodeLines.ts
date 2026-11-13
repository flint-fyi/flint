import { SyntaxKind } from "typescript";

import type { FileChange } from "@flint.fyi/core";
import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { getRuleTesterDescribedCases } from "../utils/getRuleTesterDescribedCases.ts";
import type {
	ParsedTestCaseCodeNode,
	ParsedTestCaseInvalid,
} from "../utils/types.ts";
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
			if (testCase.code !== undefined && testCase.nodes.code) {
				checkCode(
					testCase.code,
					testCase.nodes.code,
					testCase,
					undefined,
					sourceFile,
				);
				return;
			}

			if (
				typeof testCase.snapshot === "string" &&
				Object.keys(testCase.files ?? {}).length !== 1
			) {
				return;
			}

			for (const [fileName, code] of Object.entries(testCase.files ?? {})) {
				const codeNode = testCase.nodes.fileCodes?.[fileName];
				if (codeNode) {
					checkCode(code, codeNode, testCase, fileName, sourceFile);
				}
			}
		}

		function checkCode(
			code: string,
			codeNode: ParsedTestCaseCodeNode,
			testCase: ParsedTestCaseInvalid,
			fileName: string | undefined,
			sourceFile: AST.SourceFile,
		): void {
			const snapshotFileNames = Object.keys(testCase.nodes.snapshotFiles ?? {});
			const snapshotFileName =
				fileName ??
				(snapshotFileNames.length === 1 ? snapshotFileNames[0] : undefined);
			const snapshot =
				typeof testCase.snapshot === "string"
					? testCase.snapshot
					: snapshotFileName && testCase.snapshot[snapshotFileName];
			const snapshotNode =
				testCase.nodes.snapshot.kind === SyntaxKind.ObjectLiteralExpression
					? snapshotFileName && testCase.nodes.snapshotFiles?.[snapshotFileName]
					: testCase.nodes.snapshot;
			if (snapshot === undefined || !snapshotNode) {
				return;
			}

			const fix = [
				...createNewlineFixes(code, codeNode, sourceFile),
				...createNewlineFixes(snapshot, snapshotNode, sourceFile),
			];

			if (fix.length) {
				context.report({
					fix,
					message: "singleLineTest",
					range: getTSNodeRange(codeNode, sourceFile),
				});
			}
		}

		function createNewlineFixes(
			code: string,
			node: ParsedTestCaseCodeNode,
			sourceFile: AST.SourceFile,
		) {
			if (node.kind === SyntaxKind.StringLiteral) {
				return [
					{
						range: getTSNodeRange(node, sourceFile),
						text: `\`\n${code}\n\``,
					},
				];
			}

			const template =
				node.kind === SyntaxKind.TaggedTemplateExpression
					? node.template
					: node;
			const changes: FileChange[] = [];

			if (!code.startsWith("\n")) {
				changes.push({
					range: {
						begin: template.getStart(sourceFile) + 1,
						end: template.getStart(sourceFile) + 1,
					},
					text: "\n",
				});
			}

			if (!code.endsWith("\n")) {
				changes.push({
					range: {
						begin: template.getEnd() - 1,
						end: template.getEnd() - 1,
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

					for (const testCase of describedCases.invalid) {
						checkTestCase(testCase, sourceFile);
					}
				},
			},
		};
	},
});
