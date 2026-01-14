import type { Suggestion } from "../types/changes.ts";
import type { FileReport } from "../types/reports.ts";

export function createReportSuggestionKey(
	report: FileReport,
	suggestion: Suggestion,
) {
	return [report.about.id, suggestion.id].join(":");
}
