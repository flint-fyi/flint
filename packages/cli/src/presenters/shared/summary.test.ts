import { stripVTControlCharacters } from "node:util";
import { expect, test } from "vitest";

import type { PresenterSummarizeContext } from "../types.ts";
import { presentSummary } from "./summary.ts";

const summarizeContext = {
	duration: 1,
	formattingResults: {
		clean: new Set<string>(),
		dirty: new Set<string>(),
		written: false,
	},
	lintResults: {
		allFilePaths: new Set(["one.ts", "two.ts"]),
		cached: undefined,
		filesResults: new Map(),
		ruleCount: 1,
	},
} satisfies PresenterSummarizeContext;

test("does not pluralize fixable in the fixable reports summary", () => {
	const output = stripVTControlCharacters(
		[
			...presentSummary({ all: 8, files: 2, fixable: 8 }, summarizeContext),
		].join(""),
	);

	expect(output).toContain("(8 fixable with --fix)");
	expect(output).not.toContain("fixables");
});
