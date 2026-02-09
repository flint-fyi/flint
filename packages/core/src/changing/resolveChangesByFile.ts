import { CachedFactory } from "cached-factory";

import type { FileChange } from "../types/changes.ts";
import type { FileResults } from "../types/linting.ts";
import type { FileReport } from "../types/reports.ts";
import { flatten } from "../utils/arrays.ts";
import { createReportSuggestionKey } from "./createReportSuggestionKey.ts";
import { resolveChange } from "./resolveChange.ts";

export function resolveChangesByFile(
	filesResults: Map<string, FileResults>,
	requestedSuggestions: Set<string>,
) {
	const changesByFile = new CachedFactory<string, FileChange[]>(() => []);

	function collectReportFix(absoluteFilePath: string, report: FileReport) {
		if (report.fix) {
			changesByFile.get(absoluteFilePath).push(...report.fix);
		}
	}

	function collectReportSuggestions(
		absoluteFilePath: string,
		report: FileReport,
	) {
		for (const suggestion of report.suggestions ?? []) {
			const key = createReportSuggestionKey(report, suggestion);
			if (requestedSuggestions.has(key)) {
				const resolved = resolveChange(suggestion, absoluteFilePath);

				for (const change of flatten(resolved)) {
					changesByFile.get(change.filePath).push(change);
				}
			}
		}
	}

	for (const [absoluteFilePath, fileResults] of Array.from(
		filesResults.entries(),
	)) {
		for (const report of fileResults.reports) {
			collectReportFix(absoluteFilePath, report);
			collectReportSuggestions(absoluteFilePath, report);
		}
	}

	return Array.from(changesByFile.entries());
}
