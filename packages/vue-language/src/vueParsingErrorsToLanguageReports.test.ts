import { parse } from "@vue/compiler-dom";
import { describe, expect, it } from "vitest";

import { vueParsingErrorsToLanguageReports } from "./vueParsingErrorsToLanguageReports.ts";

describe("vueParsingErrorsToLanguageReports", () => {
	it("includes structured range when location is available", () => {
		// Unclosed <div> tag — error at line 1, col 5
		let parseError: unknown;
		try {
			parse("<div", { onError: () => {} });
		} catch (error) {
			parseError = error;
		}

		expect(parseError).toBeDefined();

		const reports = vueParsingErrorsToLanguageReports(
			"App.vue",
			(parseError as unknown[]) as (Error & { loc?: { start: { offset: number; column: number; line: number }; end: { offset: number } } })[],
		);

		expect(reports).toHaveLength(1);
		expect(reports[0].range).toBeDefined();
		expect(reports[0].range).toEqual({ begin: 0, end: 4 });
		expect(reports[0].text).toContain("App.vue");
	});

	it("omits range when no location info is available", () => {
		const error = new SyntaxError("unknown error");
		const reports = vueParsingErrorsToLanguageReports("App.vue", [error]);

		expect(reports).toHaveLength(1);
		expect(reports[0].range).toBeUndefined();
		expect(reports[0].text).toContain("unknown error");
	});
});
