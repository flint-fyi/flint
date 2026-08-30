import type { Diagnostic } from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

import { convertTypeScriptDiagnosticToLanguageReport } from "./convertTypeScriptDiagnosticToLanguageReport.ts";

describe("convertTypeScriptDiagnosticToLanguageReport", () => {
	it("indents nested message-chain entries by two spaces per depth", () => {
		expect(
			convertTypeScriptDiagnosticToLanguageReport({
				category: 1,
				code: 1234,
				end: 0,
				messageChain: [
					{
						category: 1,
						code: 1234,
						end: 0,
						messageChain: [
							{
								category: 1,
								code: 1234,
								end: 0,
								pos: 0,
								text: "Grandchild",
							},
						],
						pos: 0,
						text: "Child",
					},
				],
				pos: 0,
				text: "Parent",
			}),
		).toEqual({
			code: "TS1234",
			source: "typescript",
			text: "\u001b[90mTS1234\u001b[0m: Parent\n  Child\n    Grandchild",
		});
	});

	it("formats multiline gapped spans, nested chains, and related information exactly", () => {
		const diagnostic: Diagnostic = {
			category: 0,
			code: 1234,
			end: 44,
			endPosition: { character: 7, line: 5 },
			fileName: `${process.cwd()}/source.ts`,
			messageChain: [
				{
					category: 1,
					code: 1234,
					end: 0,
					messageChain: [
						{ category: 1, code: 1234, end: 0, pos: 0, text: "Deep detail" },
					],
					pos: 0,
					text: "Nested detail",
				},
			],
			pos: 2,
			relatedInformation: [
				{
					category: 3,
					code: 1235,
					end: 5,
					endPosition: { character: 5, line: 0 },
					fileName: `${process.cwd()}/related.ts`,
					pos: 0,
					sourceLines: [{ line: 0, text: "value   " }],
					startPosition: { character: 0, line: 0 },
					text: "Related detail",
				},
			],
			sourceLines: [
				{ line: 0, text: "  first   " },
				{ line: 1, text: "second" },
				{ line: 4, text: "fifth" },
				{ line: 5, text: "last       " },
			],
			startPosition: { character: 2, line: 0 },
			text: "Top message",
		};

		expect(convertTypeScriptDiagnosticToLanguageReport(diagnostic)).toEqual({
			code: "TS1234",
			range: { begin: 2, end: 44 },
			source: "typescript",
			text: "\u001b[96msource.ts\u001b[0m:\u001b[93m1\u001b[0m:\u001b[93m3\u001b[0m - \u001b[90mTS1234\u001b[0m: Top message\n  Nested detail\n    Deep detail\n\u001b[7m  1\u001b[0m   first\n\u001b[7m   \u001b[0m \u001b[91m  ~~~~~\u001b[0m\n\u001b[7m  2\u001b[0m second\n\u001b[7m   \u001b[0m \u001b[91m~~~~~~\u001b[0m\n\u001b[7m...\u001b[0m \n\u001b[7m  5\u001b[0m fifth\n\u001b[7m   \u001b[0m \u001b[91m~~~~~\u001b[0m\n\u001b[7m  6\u001b[0m last\n\u001b[7m   \u001b[0m \u001b[91m~~~~\u001b[0m\n\n \u001b[96mrelated.ts\u001b[0m:\u001b[93m1\u001b[0m:\u001b[93m1\u001b[0m\n  \u001b[7m1\u001b[0m value\n  \u001b[7m \u001b[0m \u001b[96m~~~~~\u001b[0m\n  Related detail",
		});
	});

	it("omits a range and source context for a global diagnostic", () => {
		expect(
			convertTypeScriptDiagnosticToLanguageReport({
				category: 1,
				code: 9999,
				end: 0,
				pos: 0,
				text: "Global error",
			}),
		).toEqual({
			code: "TS9999",
			source: "typescript",
			text: "\u001b[90mTS9999\u001b[0m: Global error",
		});
	});
});
