import { CachedFactory } from "cached-factory";

import type { FileChange } from "../types/changes.ts";
import type { FileResults } from "../types/linting.ts";
import type { FileReport } from "../types/reports.ts";
import { flatten } from "../utils/arrays.ts";
import { createReportSuggestionKey } from "./createReportSuggestionKey.ts";
import { resolveChange } from "./resolveChange.ts";

export async function resolveChangesByFile(
	filesResults: Map<string, FileResults>,
	requestedSuggestions: Set<string>,
) {
	const changesByFile = new CachedFactory<string, FileChange[]>(() => []);

	function collectReportFix(absoluteFilePath: string, report: FileReport) {
		if (report.fix) {
			changesByFile.get(absoluteFilePath).push(...report.fix);
		}
	}

	async function collectReportSuggestions(
		absoluteFilePath: string,
		report: FileReport,
	) {
		for (const suggestion of report.suggestions ?? []) {
			const key = createReportSuggestionKey(report, suggestion);
			if (requestedSuggestions.has(key)) {
				const resolved = await resolveChange(suggestion, absoluteFilePath);

				for (const change of flatten(resolved)) {
					changesByFile.get(change.filePath).push(change);
				}
			}
		}
	}

	await Promise.all(
		Array.from(filesResults.entries()).map(
			async ([absoluteFilePath, fileResults]) => {
				for (const report of fileResults.reports) {
					collectReportFix(absoluteFilePath, report);
					await collectReportSuggestions(absoluteFilePath, report);
				}
			},
		),
	);

	return Array.from(changesByFile.entries());
}
