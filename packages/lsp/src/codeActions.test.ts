import { describe, expect, it } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { CodeActionContext } from "vscode-languageserver/node.js";

import type { FileReport } from "@flint.fyi/core";

import { createCodeActions } from "./codeActions.ts";

describe(createCodeActions, () => {
	it("creates cross-file suggestion edits", () => {
		const workspaceRoot = "/workspace";
		const sourceUri = "file:///workspace/src/file.ts";
		const targetUri = "file:///workspace/cspell.json";
		const sourceDocument = TextDocument.create(
			sourceUri,
			"typescript",
			0,
			"const typo = true;\n",
		);
		const targetDocument = TextDocument.create(targetUri, "json", 0, "{}");
		const report: FileReport = {
			about: {
				id: "spelling/cspell",
			},
			message: {
				primary: "Forbidden or unknown word.",
				secondary: [],
				suggestions: [],
			},
			range: {
				begin: { column: 6, line: 0, raw: 6 },
				end: { column: 10, line: 0, raw: 10 },
			},
			suggestions: [
				{
					files: {
						"cspell.json": [
							{
								range: { begin: 0, end: 2 },
								text: '{"words":["typo"]}',
							},
						],
					},
					id: "addWordToWords",
				},
			],
		};
		const context: CodeActionContext = {
			diagnostics: [
				{
					code: "spelling/cspell",
					message: "Forbidden or unknown word.",
					range: {
						end: { character: 10, line: 0 },
						start: { character: 6, line: 0 },
					},
					source: "flint",
				},
			],
		};

		const actions = createCodeActions(
			sourceUri,
			context,
			[report],
			sourceDocument,
			{
				getDocument(uri) {
					return uri === targetUri ? targetDocument : sourceDocument;
				},
				workspaceRoot,
			},
		);

		expect(actions).toHaveLength(1);
		expect(actions[0]?.edit).toEqual({
			changes: {
				[targetUri]: [
					{
						newText: '{"words":["typo"]}',
						range: {
							end: { character: 2, line: 0 },
							start: { character: 0, line: 0 },
						},
					},
				],
			},
		});
		expect(actions[0]?.title).toBe("Suggestion: addWordToWords");
	});

	it("does not create code actions for language diagnostics", () => {
		const sourceUri = "file:///workspace/src/file.ts";
		const sourceDocument = TextDocument.create(
			sourceUri,
			"typescript",
			0,
			"const value = missing;\n",
		);
		const report: FileReport = {
			about: {
				id: "ts/noop",
			},
			message: {
				primary: "No-op.",
				secondary: [],
				suggestions: [],
			},
			range: {
				begin: { column: 14, line: 0, raw: 14 },
				end: { column: 21, line: 0, raw: 21 },
			},
		};
		const context: CodeActionContext = {
			diagnostics: [
				{
					code: "TS2304",
					message: "Cannot find name 'missing'.",
					range: {
						end: { character: 21, line: 0 },
						start: { character: 14, line: 0 },
					},
					source: "flint/typescript",
				},
			],
		};

		expect(
			createCodeActions(sourceUri, context, [report], sourceDocument),
		).toEqual([]);
	});
});
