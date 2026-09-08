/* cspell:disable */
import assert from "node:assert/strict";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
	applyChangesToText,
	createVFSLinterHost,
	isSuggestionForFiles,
	runConfig,
	type FileReport,
} from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

import rule from "./cspell.ts";
import { ruleTester } from "./ruleTester.ts";

describe("dictionary suggestions", () => {
	it.each([undefined, '{"words":["existing"]}'])(
		"applies dictionary suggestions to the host cwd with config %s",
		async (configText) => {
			const cwd = path.resolve("cspell-project");
			const host = createVFSLinterHost({ cwd });
			const configPath = path.resolve(cwd, "cspell.json");
			const processConfigPath = path.resolve("cspell.json");
			host.vfsUpsertFile(processConfigPath, "{}");
			if (configText !== undefined) {
				host.vfsUpsertFile(configPath, configText);
			}
			const filePath = "src/example.txt";
			const filePathAbsolute = path.resolve(cwd, filePath);
			host.vfsUpsertFile(filePathAbsolute, "incorect");

			async function lint(): Promise<FileReport[]> {
				const results = await runConfig(
					{
						filePath: path.resolve(cwd, "flint.config.ts"),
						use: [{ files: [filePath], rules: [rule] }],
					},
					host,
					{ ignoreCache: true, skipCacheWrite: true },
				);
				const fileResults = results.allFileResults.get(
					normalizePath(filePathAbsolute),
				);
				assert.ok(fileResults);
				return fileResults.reports;
			}

			expect(cwd).not.toBe(process.cwd());
			const reports = await lint();
			expect(reports).toHaveLength(1);
			const suggestion = reports[0]?.suggestions?.[0];
			assert.ok(suggestion && isSuggestionForFiles(suggestion));
			expect(suggestion).toEqual({
				files: {
					[configPath]: [
						{
							range: { begin: 0, end: configText?.length ?? 0 },
							text: JSON.stringify({
								words: [...(configText ? ["existing"] : []), "incorect"],
							}),
						},
					],
				},
				id: "addWordToWords",
			});
			await Promise.all(
				Object.entries(suggestion.files).map(async ([target, changes]) => {
					assert.ok(changes);
					await host.writeFile(
						target,
						applyChangesToText(changes, (await host.readFile(target)) ?? ""),
					);
				}),
			);
			await expect(host.readFile(configPath)).resolves.toBe(
				JSON.stringify({
					words: [...(configText ? ["existing"] : []), "incorect"],
				}),
			);
			await expect(host.readFile(processConfigPath)).resolves.toBe("{}");
			await expect(host.readFile(filePathAbsolute)).resolves.toBe("incorect");
			await expect(lint()).resolves.toEqual([]);
		},
	);
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
                incorect
`,
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: ``, updated: '{"words":["incorect"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                incorect
`,
			files: { "cspell.json": "{}" },
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: `{}`, updated: '{"words":["incorect"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                incorect
            
`,
			files: { "cspell.json": '{"words":[]}' },
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: `{"words":[]}`, updated: '{"words":["incorect"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                incorect
            
`,
			files: { "cspell.json": '{"words":["existing"]}' },
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{
								original: `{"words":["existing"]}`,
								updated: '{"words":["existing","incorect"]}',
							},
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                const myarray = [];
            
`,
			snapshot: `
                const myarray = [];
                      ~~~~~~~
                      Forbidden or unknown word: "myarray".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: ``, updated: '{"words":["myarray"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                const myarray = [];
            
`,
			files: { "cspell.json": "{}" },
			snapshot: `
                const myarray = [];
                      ~~~~~~~
                      Forbidden or unknown word: "myarray".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: `{}`, updated: '{"words":["myarray"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                const myarray = [];
            
`,
			files: { "cspell.json": '{"words":[]}' },
			snapshot: `
                const myarray = [];
                      ~~~~~~~
                      Forbidden or unknown word: "myarray".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: `{"words":[]}`, updated: '{"words":["myarray"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                const myarray = [];
            
`,
			files: { "cspell.json": '{"words":["existing"]}' },
			snapshot: `
                const myarray = [];
                      ~~~~~~~
                      Forbidden or unknown word: "myarray".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{
								original: `{"words":["existing"]}`,
								updated: '{"words":["existing","myarray"]}',
							},
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                qwertyuiop
            
`,
			snapshot: `
                qwertyuiop
                ~~~~~~~~~~
                Forbidden or unknown word: "qwertyuiop".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: ``, updated: '{"words":["qwertyuiop"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                qwertyuiop
            
`,
			files: { "cspell.json": "{}" },
			snapshot: `
                qwertyuiop
                ~~~~~~~~~~
                Forbidden or unknown word: "qwertyuiop".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: `{}`, updated: '{"words":["qwertyuiop"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                qwertyuiop
            
`,
			files: { "cspell.json": '{"words":[]}' },
			snapshot: `
                qwertyuiop
                ~~~~~~~~~~
                Forbidden or unknown word: "qwertyuiop".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{ original: `{"words":[]}`, updated: '{"words":["qwertyuiop"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                qwertyuiop
            
`,
			files: { "cspell.json": '{"words":["existing"]}' },
			snapshot: `
                qwertyuiop
                ~~~~~~~~~~
                Forbidden or unknown word: "qwertyuiop".
            
`,
			suggestions: [
				{
					files: {
						[path.resolve("cspell.json")]: [
							{
								original: `{"words":["existing"]}`,
								updated: '{"words":["existing","qwertyuiop"]}',
							},
						],
					},
					id: "addWordToWords",
				},
			],
		},
	],
	valid: ["", "known", "known-word", "knownWord"],
});
