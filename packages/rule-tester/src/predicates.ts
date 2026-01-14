import type { TestSuggestion, TestSuggestionForFiles } from "./types.ts";

export function isTestSuggestionForFiles(
	suggestion: TestSuggestion,
): suggestion is TestSuggestionForFiles {
	return "files" in suggestion;
}
