import assert from "node:assert/strict";

import {
	applyChangesToText,
	isSuggestionForFiles,
	type NormalizedReport,
	type SuggestionForFiles,
} from "@flint.fyi/core";
import { isTruthy } from "@flint.fyi/utils";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";
import { isTestSuggestionForFiles } from "./predicates.ts";
import type {
	InvalidTestCase,
	TestSuggestion,
	TestSuggestionFileCase,
} from "./types.ts";

export function resolveReportedSuggestions(
	reports: NormalizedReport[],
	testCaseNormalized: InvalidTestCase & TestCaseNormalized,
): TestSuggestion[] | undefined {
	const suggestionsReported = reports
		.flatMap((report) => report.suggestions)
		.filter(isTruthy);

	if (!suggestionsReported.length) {
		return;
	}

	return suggestionsReported.map((suggestionReported, index) => {
		const suggestionExpected = testCaseNormalized.suggestions?.[index];
		if (isSuggestionForFiles(suggestionReported)) {
			return {
				files: resolveReportedSuggestionForFiles(
					suggestionReported,
					suggestionExpected,
				),
				id: suggestionReported.id,
			};
		}

		if (suggestionExpected && isTestSuggestionForFiles(suggestionExpected)) {
			throw new Error(
				"This test case describes a suggestion across files, but the rule is only reporting changes to its own file.",
			);
		}

		return {
			id: suggestionReported.id,
			updated: applyChangesToText(
				[suggestionReported],
				testCaseNormalized.code,
			),
		};
	});
}

function resolveReportedSuggestionForFiles(
	suggestionReported: SuggestionForFiles,
	suggestionExpected: TestSuggestion | undefined,
): Record<string, TestSuggestionFileCase[]> {
	if (!suggestionExpected) {
		return {};
	}

	if (!isTestSuggestionForFiles(suggestionExpected)) {
		throw new Error(
			"This test case describes a suggestion to its own file, but the rule is reporting changes across files.",
		);
	}

	assert.deepStrictEqual(
		Object.keys(suggestionReported.files).sort(),
		Object.keys(suggestionExpected.files).sort(),
		"Reported suggestion target paths must exactly match expected target paths.",
	);

	return Object.fromEntries(
		Object.entries(suggestionExpected.files).map(
			([filePath, suggestionCasesExpected]) => {
				const changes = suggestionReported.files[filePath];
				assert(changes);
				return [
					filePath,
					suggestionCasesExpected.map((suggestionCaseExpected) => ({
						original: suggestionCaseExpected.original,
						updated: applyChangesToText(
							changes,
							suggestionCaseExpected.original,
						),
					})),
				];
			},
		),
	);
}
