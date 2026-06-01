import { parse } from "svelte/compiler";
import { describe, expect, it } from "vitest";

import { errorToLanguageReport } from "./volarLanguagePlugin.ts";

describe("errorToLanguageReport", () => {
	it("uses start.character and end.character for Svelte CompileError", () => {
		const error = {
			end: { character: 20, column: 15, line: 1 },
			message: "parse error",
			start: { character: 10, column: 5, line: 1 },
		};

		expect(errorToLanguageReport("App.svelte", error)).toEqual({
			range: { begin: 10, end: 20 },
			text: "App.svelte:1:5 - parse error",
		});
	});

	it("omits range when no position info is available", () => {
		const error = { message: "unknown error" };

		expect(errorToLanguageReport("App.svelte", error).range).toBeUndefined();
	});

	it("reports loc and range from a real Svelte parse error", () => {
		// "line1\nline2\n<div" — unclosed <div> tag, error at line 3 col 4 (character offset 16)
		let parseError: unknown;
		try {
			parse("line1\nline2\n<div", { loose: false, modern: true });
		} catch (error) {
			parseError = error;
		}
		const result = errorToLanguageReport("App.svelte", parseError);

		expect(result.text).toBe(
			`App.svelte:3:4 - ${(parseError as { message: string }).message}`,
		);
		expect(result.range).toEqual({ begin: 16, end: 16 });
	});

	it("returns fallback text for non-object errors", () => {
		expect(errorToLanguageReport("App.svelte", "oops")).toEqual({
			text: "App.svelte - Unknown error",
		});
	});
});
