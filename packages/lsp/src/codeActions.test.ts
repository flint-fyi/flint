import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { CodeActionContext } from "vscode-languageserver/node.js";

import type { FileReport } from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

import { createCodeActions } from "./codeActions.ts";

describe(createCodeActions, () => {
	it("sends edits for the document versions that were linted", () => {
		const workspaceRoot = normalizePath(path.resolve("workspace"));
		const sourceFilePath = `${workspaceRoot}/src/file.ts`;
		const targetFilePath = `${workspaceRoot}/cspell.json`;
		const documents = new Map([
			[
				sourceFilePath,
				TextDocument.create("file:///source", "typescript", 0, "const typo;"),
			],
			[targetFilePath, TextDocument.create("file:///target", "json", 0, "{}")],
		]);
		const range = {
			begin: { column: 6, line: 0, raw: 6 },
			end: { column: 10, line: 0, raw: 10 },
		};

		const actions = createCodeActions(
			sourceFilePath,
			{
				diagnostics: [
					{
						code: "spelling/cspell",
						message: "Unknown word.",
						range: {
							end: { character: 10, line: 0 },
							start: { character: 6, line: 0 },
						},
						source: "flint",
					},
				],
			},
			[
				{
					about: { id: "spelling/cspell" },
					fix: [{ range: { begin: 6, end: 10 }, text: "word" }],
					message: { primary: "Unknown word.", secondary: [], suggestions: [] },
					range,
					suggestions: [
						{
							files: {
								"cspell.json": [{ range: { begin: 0, end: 2 }, text: "[]" }],
							},
							id: "addWordToWords",
						},
					],
				},
			],
			{
				documentVersions: new Map([[sourceFilePath, 3]]),
				getDocument: (filePath) => documents.get(filePath),
				workspaceRoot,
			},
		);

		expect(actions.map(({ edit }) => edit)).toEqual([
			{
				documentChanges: [
					{
						edits: [
							{
								newText: "word",
								range: {
									end: { character: 10, line: 0 },
									start: { character: 6, line: 0 },
								},
							},
						],
						textDocument: {
							uri: pathToFileURL(sourceFilePath).href,
							version: 3,
						},
					},
				],
			},
			{
				documentChanges: [
					{
						edits: [
							{
								newText: "[]",
								range: {
									end: { character: 2, line: 0 },
									start: { character: 0, line: 0 },
								},
							},
						],
						textDocument: {
							uri: pathToFileURL(targetFilePath).href,
							version: null,
						},
					},
				],
			},
		]);
	});

	it("creates fixes and suggestion edits", () => {
		const workspaceRoot = path.resolve("workspace");
		const sourceFilePath = normalizePath(
			path.join(workspaceRoot, "src/file.ts"),
		);
		const targetFilePath = normalizePath(
			path.join(workspaceRoot, "cspell.json"),
		);
		const sourceUri = pathToFileURL(sourceFilePath).href;
		const targetUri = pathToFileURL(targetFilePath).href;
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
			fix: [
				{
					range: { begin: 6, end: 10 },
					text: "word",
				},
			],
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
				{
					files: {
						"empty.json": [],
					},
					id: "empty",
				},
				{
					id: "replaceWord",
					range: { begin: 6, end: 10 },
					text: "word",
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
				{
					code: "spelling/cspell",
					message: "Forbidden or unknown word.",
					range: {
						end: { character: 10, line: 0 },
						start: { character: 6, line: 0 },
					},
					source: "flint/typescript",
				},
				{
					code: "spelling/other",
					message: "Other report.",
					range: {
						end: { character: 10, line: 0 },
						start: { character: 6, line: 0 },
					},
					source: "flint",
				},
			],
		};

		const documents = new Map([
			[sourceFilePath, sourceDocument],
			[targetFilePath, targetDocument],
		]);
		const actions = createCodeActions(sourceFilePath, context, [report], {
			getDocument: (filePath) => documents.get(filePath),
			workspaceRoot,
		});

		const replaceWordEdit = {
			changes: {
				[sourceUri]: [
					{
						newText: "word",
						range: {
							end: { character: 10, line: 0 },
							start: { character: 6, line: 0 },
						},
					},
				],
			},
		};

		expect(actions).toHaveLength(3);
		expect(actions[0]?.edit).toEqual(replaceWordEdit);
		expect(actions[0]?.title).toBe("Fix: Forbidden or unknown word.");
		expect(actions[1]?.edit).toEqual({
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
		expect(actions[1]?.title).toBe("Suggestion: addWordToWords");
		expect(actions[2]?.edit).toEqual(replaceWordEdit);
		expect(actions[2]?.title).toBe("Suggestion: replaceWord");

		documents.delete(targetFilePath);

		expect(
			createCodeActions(sourceFilePath, context, [report], {
				getDocument: (filePath) => documents.get(filePath),
				workspaceRoot,
			}),
		).toHaveLength(2);
	});
});
