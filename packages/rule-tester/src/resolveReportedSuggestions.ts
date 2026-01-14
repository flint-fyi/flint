import {
	applyChangesToText,
	isSuggestionForFiles,
	type NormalizedReport,
	type SuggestionForFiles,
} from "@flint.fyi/core";
import { isTruthy } from "@flint.fyi/utils";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";
import { isTestSuggestionForFiles } from "./predicates.ts";
import type { InvalidTestCase, TestSuggestionFileCase } from "./types.ts";

export function resolveReportedSuggestions(
	reports: NormalizedReport[],
	testCaseNormalized: InvalidTestCase & TestCaseNormalized,
) {
	const suggestionsReported = reports
		.flatMap((report) => report.suggestions)
		.filter(isTruthy);

	if (!suggestionsReported.length) {
		return undefined;
	}

	return suggestionsReported.map((suggestionReported) =>
		isSuggestionForFiles(suggestionReported)
			? {
					files: resolveReportedSuggestionForFiles(
						suggestionReported,
						testCaseNormalized,
					),
					id: suggestionReported.id,
				}
			: {
					id: suggestionReported.id,
					updated: applyChangesToText(
						[suggestionReported],
						testCaseNormalized.code,
					),
				},
	);
}

function resolveReportedSuggestionForFiles(
	suggestionReported: SuggestionForFiles,
	testCaseNormalized: InvalidTestCase & TestCaseNormalized,
) {
	if (!testCaseNormalized.suggestions) {
		return {};
	}

	if (!testCaseNormalized.suggestions.every(isTestSuggestionForFiles)) {
		throw new Error(
			"This test case describes suggestions across files, but the rule is only reporting changes to its own file.",
		);
	}

	return Object.fromEntries(
		testCaseNormalized.suggestions.flatMap(
			(suggestionExpected): [string, TestSuggestionFileCase[]][] => {
				return Object.entries(suggestionExpected.files).map(
					([filePath, suggestionCasesExpected]) => {
						return [
							filePath,
							suggestionCasesExpected.map((suggestionCaseExpected) => {
								const changes = suggestionReported.files[filePath]?.(
									suggestionCaseExpected.original,
								);
								return {
									original: suggestionCaseExpected.original,
									updated: changes
										? applyChangesToText(
												changes,
												suggestionCaseExpected.original,
											)
										: suggestionCaseExpected.original,
								};
							}),
						];
					},
				);
			},
		),
	);
}
