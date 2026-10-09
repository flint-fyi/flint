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
		const result = resolveReportedSuggestions(
			[],
			mockTestCaseNormalized,
			"/project",
		);

		expect(result).toEqual(undefined);
	});

	it("returns undefined when given one report with no suggestions", () => {
		const report = {
			...mockReport,
			suggestions: [],
		};

		const result = resolveReportedSuggestions(
			[report],
			mockTestCaseNormalized,
			"/project",
		);

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

		const result = resolveReportedSuggestions(
			[report],
			mockTestCaseNormalized,
			"/project",
		);

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
			resolveReportedSuggestions(
				[report],
				{
					...mockTestCaseNormalized,
					suggestions: [
						{
							files: {
								"file.ts": [{ original: "abc", updated: "def" }],
							},
							id: "suggestion-result",
						},
					],
				},
				"/project",
			),
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
			resolveReportedSuggestions(
				[report],
				{
					...mockTestCaseNormalized,
					suggestions: [
						{
							id: "suggestion-result",
							updated: "...",
						},
					],
				},
				"/project",
			),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: This test case describes a suggestion to its own file, but the rule is reporting changes across files.]`,
		);
	});

	it.each([
		["/project/expected.ts", "/project/unexpected.ts"],
		["/project/unexpected.ts"],
		[],
		["expected.ts"],
	])("rejects mismatched target paths: %j", (...filePaths) => {
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
				"/project",
			),
		).toThrow(
			"Reported suggestion target paths must exactly match expected target paths.",
		);
	});

	it.each([
		["/project", "config.json", "/project/config.json"],
		["/project", "../shared/config.json", "/shared/config.json"],
		["/project", "/other/config.json", "/other/config.json"],
		["C:/project", "config.json", "C:/project/config.json"],
	])(
		"resolves expected targets against %s: %s",
		(cwd, expectedPath, reportedPath) => {
			const suggestions = [
				{
					files: { [expectedPath]: [{ original: "before", updated: "after" }] },
					id: "replace",
				},
			];
			expect(
				resolveReportedSuggestions(
					[
						{
							...mockReport,
							suggestions: [
								{
									files: {
										[reportedPath]: [
											{ range: { begin: 0, end: 6 }, text: "after" },
										],
									},
									id: "replace",
								},
							],
						},
					],
					{ ...mockTestCaseNormalized, suggestions },
					cwd,
				),
			).toEqual(suggestions);
		},
	);

	it("rejects duplicate expected paths that resolve to the same target", () => {
		expect(() =>
			resolveReportedSuggestions(
				[
					{
						...mockReport,
						suggestions: [
							{ files: { "/project/file.ts": [] }, id: "duplicate" },
						],
					},
				],
				{
					...mockTestCaseNormalized,
					suggestions: [
						{ files: { "./file.ts": [], "file.ts": [] }, id: "duplicate" },
					],
				},
				"/project",
			),
		).toThrow(
			"Reported suggestion target paths must exactly match expected target paths.",
		);
	});

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
						files: {
							[`/project/${text}.ts`]: [{ range: { begin: 0, end: 3 }, text }],
						},
						id: "suggestion",
					},
				],
			})),
			{ ...mockTestCaseNormalized, suggestions },
			"/project",
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
				files: {
					"/project/other.ts": [{ range: { begin: 0, end: 3 }, text: "other" }],
				},
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
				"/project",
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
						"/project/file.ts": [{ range: { begin: 0, end: 3 }, text: "def" }],
					},
					id: "suggestion-report",
				},
			],
		};

		const result = resolveReportedSuggestions(
			[report],
			{
				...mockTestCaseNormalized,
				suggestions: [
					{
						files: {
							"file.ts": [{ original: "abc", updated: "def" }],
						},
						id: "suggestion-result",
					},
				],
			},
			"/project",
		);

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
						"/project/fileA.ts": [
							{ range: { begin: 0, end: 5 }, text: "def-A" },
						],
						"/project/fileB.ts": [
							{ range: { begin: 0, end: 5 }, text: "def-B" },
						],
					},
					id: "suggestion-report",
				},
			],
		};

		const result = resolveReportedSuggestions(
			[report],
			{
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
			},
			"/project",
		);

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
