import type { FileReport, FileResults } from "@flint.fyi/core";
import { stripVTControlCharacters } from "node:util";
import { expect, test } from "vitest";

import { printSummary } from "./printSummary.ts";

function createFileResults(reports: FileReport[]): FileResults {
	return {
		dependencies: new Set(),
		languageReports: [],
		reports,
	};
}

function createFixableReport(): FileReport {
	return {
		about: { id: "test/rule" },
		fix: [],
		message: {
			primary: "Primary message.",
			secondary: [],
			suggestions: [],
		},
		range: {
			begin: { column: 0, line: 0, raw: 0 },
			end: { column: 1, line: 0, raw: 1 },
		},
	};
}

test("does not pluralize fixable in the interactive fixable reports summary", () => {
	const reports = Array.from({ length: 8 }, createFixableReport);
	const output = stripVTControlCharacters(
		printSummary([
			["one.ts", createFileResults(reports.slice(0, 4))],
			["two.ts", createFileResults(reports.slice(4))],
		]),
	);

	expect(output).toBe(
		"✖ Found 8 reports across 2 files (8 fixable with --fix).",
	);
});
