import assert from "node:assert/strict";

import { resolve } from "pathe";

import {
	applyChangesToText,
	isSuggestionForFiles,
	type SuggestionForFiles,
} from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";
import { isTestSuggestionForFiles } from "./predicates.ts";
import type { TestCaseReport } from "./runTestCaseRule.ts";
import type {
	InvalidTestCase,
	TestSuggestion,
	TestSuggestionFileCase,
} from "./types.ts";

export function resolveReportedSuggestions(
	reports: TestCaseReport[],
	testCaseNormalized: InvalidTestCase & TestCaseNormalized,
	cwd: string,
): TestSuggestion[] | undefined {
	const suggestionsReported = reports.flatMap((report) =>
		(report.suggestions ?? []).map((suggestionReported) => ({
			fileName: report.fileName,
			suggestionReported,
		})),
	);

	if (!suggestionsReported.length) {
		return;
	}

	return suggestionsReported.map(({ fileName, suggestionReported }, index) => {
		const suggestionExpected = testCaseNormalized.suggestions?.[index];
		if (isSuggestionForFiles(suggestionReported)) {
			return {
				files: resolveReportedSuggestionForFiles(
					suggestionReported,
					suggestionExpected,
					cwd,
				),
				id: suggestionReported.id,
			};
		}

		const original = nullThrows(
			testCaseNormalized.lintedFiles[fileName],
			`Expected source text for reported file '${fileName}'.`,
		);
		const updated = applyChangesToText([suggestionReported], original);
		if (Object.keys(testCaseNormalized.lintedFiles).length > 1) {
			return {
				files: { [fileName]: [{ original, updated }] },
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
			updated,
		};
	});
}

function resolveReportedSuggestionForFiles(
	suggestionReported: SuggestionForFiles,
	suggestionExpected: TestSuggestion | undefined,
	cwd: string,
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
		Object.keys(suggestionReported.files).toSorted(),
		Object.keys(suggestionExpected.files)
			.map((filePath) => resolve(cwd, filePath))
			.toSorted(),
		"Reported suggestion target paths must exactly match expected target paths.",
	);

	return Object.fromEntries(
		Object.entries(suggestionExpected.files).map(
			([filePath, suggestionCasesExpected]) => {
				const changes = suggestionReported.files[resolve(cwd, filePath)];
				assert.ok(
					changes,
					`Expected reported suggestion "${suggestionReported.id}" to provide changes for target "${filePath}".`,
				);
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
