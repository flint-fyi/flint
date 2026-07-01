import { describe, expect, it } from "vitest";

import type { FileReport } from "@flint.fyi/core";

import { githubPresenterFactory } from "./githubPresenterFactory.ts";
import type { PresenterVirtualFile } from "./types.ts";

function createReport(
	overrides: Partial<FileReport> & Pick<FileReport, "about" | "range">,
): FileReport {
	return {
		message: {
			primary: "Something went wrong.",
			secondary: [],
			suggestions: [],
		},
		...overrides,
	};
}

async function renderFile(file: PresenterVirtualFile, reports: FileReport[]) {
	const presenter = githubPresenterFactory.initialize({
		configFileName: "flint.config.ts",
		ignoreCache: false,
		runMode: "single-run",
	});

	const lines = await Array.fromAsync(presenter.renderFile({ file, reports }));

	return lines.join("");
}

const file: PresenterVirtualFile = {
	filePath: "src/example.ts",
	text: "const x = 1;\n",
};

describe("githubPresenterFactory", () => {
	it("does not emit a header or summary", () => {
		const presenter = githubPresenterFactory.initialize({
			configFileName: "flint.config.ts",
			ignoreCache: false,
			runMode: "single-run",
		});

		expect("header" in presenter).toBe(false);
		expect("summarize" in presenter).toBe(false);
	});

	it("emits a single-line error annotation with column info", async () => {
		const output = await renderFile(file, [
			createReport({
				about: { id: "no-unused-vars" },
				message: {
					primary: "'x' is unused.",
					secondary: [],
					suggestions: [],
				},
				range: {
					begin: { column: 6, line: 0, raw: 6 },
					end: { column: 7, line: 0, raw: 7 },
				},
			}),
		]);

		expect(output).toMatchInlineSnapshot(`
			"::error file=src/example.ts,line=1,col=7,endColumn=8,endLine=1,title=no-unused-vars::no-unused-vars: 'x' is unused. [src/example.ts:1:7]
			"
		`);
	});

	it("omits column info for multi-line reports", async () => {
		const output = await renderFile(file, [
			createReport({
				about: { id: "no-multi-line" },
				message: { primary: "Spans lines.", secondary: [], suggestions: [] },
				range: {
					begin: { column: 0, line: 1, raw: 12 },
					end: { column: 3, line: 3, raw: 40 },
				},
			}),
		]);

		expect(output).toMatchInlineSnapshot(`
			"::error file=src/example.ts,line=2,endLine=4,title=no-multi-line::no-multi-line: Spans lines. [src/example.ts:2:1]
			"
		`);
	});

	it("escapes special characters in the rule id and message", async () => {
		const output = await renderFile(file, [
			createReport({
				about: { id: "plugin:rule" },
				message: {
					primary: "Use 100% care: a, b\nand more.",
					secondary: [],
					suggestions: [],
				},
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 2, line: 0, raw: 2 },
				},
			}),
		]);

		expect(output).toMatchInlineSnapshot(`
			"::error file=src/example.ts,line=1,col=1,endColumn=3,endLine=1,title=plugin%3Arule::plugin:rule: Use 100%25 care: a, b%0Aand more. [src/example.ts:1:1]
			"
		`);
	});

	it("emits one annotation per report", async () => {
		const output = await renderFile(file, [
			createReport({
				about: { id: "rule-a" },
				message: { primary: "First.", secondary: [], suggestions: [] },
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 1, line: 0, raw: 1 },
				},
			}),
			createReport({
				about: { id: "rule-b" },
				message: { primary: "Second.", secondary: [], suggestions: [] },
				range: {
					begin: { column: 0, line: 2, raw: 20 },
					end: { column: 1, line: 2, raw: 21 },
				},
			}),
		]);

		expect(output).toMatchInlineSnapshot(`
			"::error file=src/example.ts,line=1,col=1,endColumn=2,endLine=1,title=rule-a::rule-a: First. [src/example.ts:1:1]
			::error file=src/example.ts,line=3,col=1,endColumn=2,endLine=3,title=rule-b::rule-b: Second. [src/example.ts:3:1]
			"
		`);
	});
});
