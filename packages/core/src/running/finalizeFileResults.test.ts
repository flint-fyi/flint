import { describe, expect, it } from "vitest";

import type { LinterHost } from "../types/host.ts";
import type { AnyLanguage, AnyLanguageFile } from "../types/languages.ts";
import { finalizeFileResults } from "./finalizeFileResults.ts";

describe(finalizeFileResults, () => {
	it("stamps each language report with a source derived from the language name", () => {
		const language = {
			about: { name: "TypeScript" },
			getLanguageReports: () => [{ text: "broken" }, { text: "also broken" }],
		} as unknown as AnyLanguage;
		const host = {
			isCaseSensitiveFS: () => true,
		} as unknown as LinterHost;

		const results = finalizeFileResults(
			"index.ts",
			[{ file: {} as AnyLanguageFile, language }],
			[],
			host,
		);

		expect(results.languageReports).toEqual([
			{ source: "flint/typescript", text: "broken" },
			{ source: "flint/typescript", text: "also broken" },
		]);
	});

	it("keeps a source the producer already set instead of overwriting it", () => {
		const language = {
			about: { name: "TypeScript" },
			getLanguageReports: () => [
				{ source: "flint/astro", text: "astro diagnostic" },
				{ text: "typescript diagnostic" },
			],
		} as unknown as AnyLanguage;
		const host = {
			isCaseSensitiveFS: () => true,
		} as unknown as LinterHost;

		const results = finalizeFileResults(
			"index.astro",
			[{ file: {} as AnyLanguageFile, language }],
			[],
			host,
		);

		expect(results.languageReports).toEqual([
			{ source: "flint/astro", text: "astro diagnostic" },
			{ source: "flint/typescript", text: "typescript diagnostic" },
		]);
	});
});
