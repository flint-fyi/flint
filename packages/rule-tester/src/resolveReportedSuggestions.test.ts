import { describe, expect, it } from "vitest";

import { resolveReportedSuggestions } from "./resolveReportedSuggestions.ts";

const mockReport = {
	message: { primary: "", secondary: [], suggestions: [] },
	range: {
		begin: { column: 0, line: 1, raw: 0 },
		end: { column: 3, line: 1, raw: 3 },
	},
};

const mockTestCaseNormalized = {
	code: "xyz",
	fileName: "file.ts",
	snapshot: "",
};

describe("resolveReportedSuggestions", () => {
	it("returns undefined when reports is empty", () => {
		const result = resolveReportedSuggestions([], mockTestCaseNormalized);

		expect(result).toEqual(undefined);
	});

	it("returns undefined when given one report with no suggestions", () => {
		const report = {
			...mockReport,
			suggestions: [],
		};

		const result = resolveReportedSuggestions([report], mockTestCaseNormalized);

		expect(result).toEqual(undefined);
	});

	it("returns id and updated text when given a single file suggestion", () => {
		const suggestion = {
			id: "suggestion",
			range: { begin: 0, end: 3 },
			text: "abc",
		};
		const report = {
			...mockReport,
			suggestions: [suggestion],
		};

		const result = resolveReportedSuggestions([report], mockTestCaseNormalized);

		expect(result).toEqual([
			{
				id: suggestion.id,
				updated: suggestion.text,
			},
		]);
	});

	it("throws when given a test case with no suggestions", () => {
		const report = {
			...mockReport,
			suggestions: [
				{
					files: {
						"file.ts": () => [{ range: { begin: 0, end: 3 }, text: "def" }],
					},
					id: "suggestion-report",
				},
			],
		};

		expect(() =>
			resolveReportedSuggestions([report], {
				...mockTestCaseNormalized,
				suggestions: [
					{
						id: "suggestion-result",
						updated: "...",
					},
				],
			}),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: This test case describes suggestions across files, but the rule is only reporting changes to its own file.]`,
		);
	});

	it("throws when given a test case that doesn't have cross-file suggestions", () => {
		const report = {
			...mockReport,
			suggestions: [
				{
					files: {
						"file.ts": () => [{ range: { begin: 0, end: 3 }, text: "def" }],
					},
					id: "suggestion-report",
				},
			],
		};

		expect(() =>
			resolveReportedSuggestions([report], {
				...mockTestCaseNormalized,
				suggestions: [
					{
						id: "suggestion-result",
						updated: "...",
					},
				],
			}),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: This test case describes suggestions across files, but the rule is only reporting changes to its own file.]`,
		);
	});

	it("returns id and a files object when given multi-file suggestions with a single file", () => {
		const report = {
			...mockReport,
			suggestions: [
				{
					files: {
						"file.ts": () => [{ range: { begin: 0, end: 3 }, text: "def" }],
					},
					id: "suggestion-report",
				},
			],
		};

		const result = resolveReportedSuggestions([report], {
			...mockTestCaseNormalized,
			suggestions: [
				{
					files: {
						"file.ts": [{ original: "abc", updated: "def" }],
					},
					id: "suggestion-result",
				},
			],
		});

		expect(result).toEqual([
			{
				files: {
					"file.ts": [
						{
							original: "abc",
							updated: "def",
						},
					],
				},
				id: "suggestion-report",
			},
		]);
	});

	it("returns id and a files object when given multi-file suggestions with multiple file", () => {
		const report = {
			...mockReport,
			suggestions: [
				{
					files: {
						"fileA.ts": () => [{ range: { begin: 0, end: 5 }, text: "def-A" }],
						"fileB.ts": () => [{ range: { begin: 0, end: 5 }, text: "def-B" }],
					},
					id: "suggestion-report",
				},
			],
		};

		const result = resolveReportedSuggestions([report], {
			...mockTestCaseNormalized,
			suggestions: [
				{
					files: {
						"fileA.ts": [{ original: "abc-A", updated: "def-A" }],
						"fileB.ts": [{ original: "abc-B", updated: "def-B" }],
					},
					id: "suggestion-result",
				},
			],
		});

		expect(result).toEqual([
			{
				files: {
					"fileA.ts": [
						{
							original: "abc-A",
							updated: "def-A",
						},
					],
					"fileB.ts": [
						{
							original: "abc-B",
							updated: "def-B",
						},
					],
				},
				id: "suggestion-report",
			},
		]);
	});
});
