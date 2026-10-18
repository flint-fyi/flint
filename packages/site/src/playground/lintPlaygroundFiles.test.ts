import { describe, expect, it } from "vitest";

import { lintPlaygroundFiles } from "./lintPlaygroundFiles.ts";

describe(lintPlaygroundFiles, () => {
	it("returns an AST and no reports for files without issues", async () => {
		const results = await lintPlaygroundFiles([
			{ code: "export const value = [1, 2].map(String);\n", name: "index.ts" },
			{ code: '{ "name": "flint" }', name: "data.json" },
		]);

		expect(results).toEqual({
			"data.json": {
				ast: expect.objectContaining({ kind: "Document" }),
				reports: [],
			},
			"index.ts": {
				ast: expect.objectContaining({ kind: "SourceFile" }),
				reports: [],
			},
		});
	});

	it("returns sorted Flint and TypeScript reports with interpolated messages", async () => {
		const code = [
			"let value: number = 'text';",
			"debugger;",
			"export { value };",
		].join("\n");

		const results = await lintPlaygroundFiles([{ code, name: "index.ts" }]);

		expect(results["index.ts"].reports).toEqual([
			{
				begin: 4,
				column: 4,
				end: 9,
				id: "TS2322",
				line: 0,
				message: "Type 'string' is not assignable to type 'number'.",
				source: "language",
			},
			{
				begin: 28,
				column: 0,
				end: 37,
				id: "ts/debuggerStatements",
				line: 1,
				message: "Debugger statements should not be used in production code.",
				source: "flint",
				url: "https://flint.fyi/rules/ts/debuggerstatements",
			},
		]);
	});

	it("uses types imported from other files", async () => {
		const results = await lintPlaygroundFiles([
			{
				code: 'import { unsafe } from "./other";\n\nexport const property = unsafe.property;\n',
				name: "index.ts",
			},
			{ code: "export declare const unsafe: any;\n", name: "other.ts" },
		]);

		expect(results["index.ts"].reports).toContainEqual(
			expect.objectContaining({
				id: "ts/anyMemberAccess",
				message: "Unsafe member access on `any` typed value.",
			}),
		);
	});

	it("lints JSX in .tsx files with the JSX plugin", async () => {
		const results = await lintPlaygroundFiles([
			{
				code: "export const image = <img />;\n",
				name: "image.tsx",
			},
		]);

		expect(results["image.tsx"].reports.map((report) => report.id)).toEqual([
			"jsx/altTexts",
		]);
	});

	it("lints JavaScript files without emit errors in other files", async () => {
		const results = await lintPlaygroundFiles([
			{ code: "export const value = 1;\n", name: "index.ts" },
			{ code: "export const other = 2;\n", name: "other.js" },
		]);

		expect(results).toEqual({
			"index.ts": expect.objectContaining({ reports: [] }),
			"other.js": expect.objectContaining({ reports: [] }),
		});
	});

	it("returns Flint reports for JSON files", async () => {
		const results = await lintPlaygroundFiles([
			{ code: '{ "a": 1, "a": 2 }', name: "data.json" },
		]);

		expect(results["data.json"].reports.map((report) => report.id)).toEqual([
			"json/keyDuplicates",
		]);
	});

	it("returns a syntax report without an AST for invalid JSON and still lints other files", async () => {
		const results = await lintPlaygroundFiles([
			{ code: '{\n  "a": tru\n}', name: "data.json" },
			{ code: "debugger;\n", name: "index.ts" },
		]);

		expect(results).toEqual({
			"data.json": {
				reports: [
					{
						begin: 9,
						column: 7,
						end: 9,
						id: "SyntaxError",
						line: 1,
						message: "Unexpected identifier 'tru' found.",
						source: "language",
					},
				],
			},
			"index.ts": {
				ast: expect.objectContaining({ kind: "SourceFile" }),
				reports: [expect.objectContaining({ id: "ts/debuggerStatements" })],
			},
		});
	});

	it("reports an unexpected end of JSON input at the end of the file", async () => {
		const results = await lintPlaygroundFiles([
			{ code: '{ "a": ', name: "data.json" },
		]);

		expect(
			results["data.json"].reports.map(({ begin, column, line }) => ({
				begin,
				column,
				line,
			})),
		).toEqual([{ begin: 7, column: 7, line: 0 }]);
	});

	it("ignores files with unsupported extensions", async () => {
		const results = await lintPlaygroundFiles([
			{ code: "debugger;", name: "notes.txt" },
		]);

		expect(results).toEqual({});
	});
});
