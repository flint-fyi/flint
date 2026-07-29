import { CachedFactory } from "cached-factory";

import type { FileChangeset } from "../types/changes.ts";
import type { FileResults } from "../types/linting.ts";
import type { FileReport } from "../types/reports.ts";
import { flatten } from "../utils/arrays.ts";
import { createReportSuggestionKey } from "./createReportSuggestionKey.ts";
import { resolveChange } from "./resolveChange.ts";

export function resolveChangesByFile(
	filesResults: Map<string, FileResults>,
	requestedSuggestions: Set<string>,
): [filePath: string, fileChangeset: FileChangeset][] {
	const changesByFile = new CachedFactory<string, FileChangeset>(() => ({
		patches: [],
	}));

	function collectReportFix(absoluteFilePath: string, report: FileReport) {
		if (report.fix) {
			const patches = (changesByFile.get(absoluteFilePath).patches ??= []);
			patches.push(...report.fix);
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

				for (const change of flatten(resolved.patches)) {
					const changeset = changesByFile.get(change.filePath);
					const patches = (changeset.patches ??= []);
					patches.push(change);

					if (resolved.newPath !== undefined) {
						changeset.newPath ??= resolved.newPath;
					}
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
