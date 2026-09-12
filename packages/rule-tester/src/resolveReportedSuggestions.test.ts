import { describe, expect, it } from "vitest";

import { resolveReportedSuggestions } from "./resolveReportedSuggestions.ts";
import type { TestSuggestion } from "./types.ts";

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

	it("throws when an own-file suggestion is expected to target other files", () => {
		const report = {
			...mockReport,
			suggestions: [
				{
					id: "suggestion-report",
					range: { begin: 0, end: 3 },
					text: "def",
				},
			],
		};

		expect(() =>
			resolveReportedSuggestions([report], {
				...mockTestCaseNormalized,
				suggestions: [
					{
						files: {
							"file.ts": [{ original: "abc", updated: "def" }],
						},
						id: "suggestion-result",
					},
				],
			}),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: This test case describes a suggestion across files, but the rule is only reporting changes to its own file.]`,
		);
	});

	it("throws when given a test case that doesn't have cross-file suggestions", () => {
		const report = {
			...mockReport,
			suggestions: [
				{
					files: {
						"file.ts": [{ range: { begin: 0, end: 3 }, text: "def" }],
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
			`[Error: This test case describes a suggestion to its own file, but the rule is reporting changes across files.]`,
		);
	});

	it.each([["expected.ts", "unexpected.ts"], ["unexpected.ts"], []])(
		"rejects mismatched target paths: %j",
		(...filePaths) => {
			expect(() =>
				resolveReportedSuggestions(
					[
						{
							...mockReport,
							suggestions: [
								{
									files: Object.fromEntries(
										filePaths.map((filePath) => [filePath, []]),
									),
									id: "suggestion",
								},
							],
						},
					],
					{
						...mockTestCaseNormalized,
						suggestions: [
							{
								files: { "expected.ts": [{ original: "abc", updated: "abc" }] },
								id: "suggestion",
							},
						],
					},
				),
			).toThrow(
				"Reported suggestion target paths must exactly match expected target paths.",
			);
		},
	);

	it("pairs cross-file suggestions by flattened report order, even with identical ids", () => {
		const suggestions: TestSuggestion[] = [
			{
				files: { "first.ts": [{ original: "abc", updated: "first" }] },
				id: "suggestion",
			},
			{
				files: { "second.ts": [{ original: "xyz", updated: "second" }] },
				id: "suggestion",
			},
		];

		const result = resolveReportedSuggestions(
			["first", "second"].map((text) => ({
				...mockReport,
				suggestions: [
					{
						files: { [`${text}.ts`]: [{ range: { begin: 0, end: 3 }, text }] },
						id: "suggestion",
					},
				],
			})),
			{ ...mockTestCaseNormalized, suggestions },
		);

		expect(result).toEqual(suggestions);
	});

	it.each([false, true])(
		"accepts mixed suggestion variants (own-file first: %s)",
		(ownFileFirst) => {
			const ownFileReported = {
				id: "own",
				range: { begin: 0, end: 3 },
				text: "own",
			};
			const crossFileReported = {
				files: { "other.ts": [{ range: { begin: 0, end: 3 }, text: "other" }] },
				id: "cross",
			};
			const ownFileExpected = { id: "own", updated: "own" };
			const crossFileExpected = {
				files: { "other.ts": [{ original: "abc", updated: "other" }] },
				id: "cross",
			};
			const suggestions = ownFileFirst
				? [ownFileExpected, crossFileExpected]
				: [crossFileExpected, ownFileExpected];

			const result = resolveReportedSuggestions(
				[
					{
						...mockReport,
						suggestions: ownFileFirst
							? [ownFileReported, crossFileReported]
							: [crossFileReported, ownFileReported],
					},
				],
				{ ...mockTestCaseNormalized, suggestions },
			);

			expect(result).toEqual(suggestions);
		},
	);

	it("returns id and a files object when given multi-file suggestions with a single file", () => {
		const report = {
			...mockReport,
			suggestions: [
				{
					files: {
						"file.ts": [{ range: { begin: 0, end: 3 }, text: "def" }],
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
						"fileA.ts": [{ range: { begin: 0, end: 5 }, text: "def-A" }],
						"fileB.ts": [{ range: { begin: 0, end: 5 }, text: "def-B" }],
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
