import { pathKey } from "@flint.fyi/utils";
import { debugForFile } from "debug-for-file";
import { resolve } from "node:path";

import { DirectivesFilterer } from "../directives/DirectivesFilterer.ts";
import { directiveReports } from "../directives/reports/directiveReports.ts";
import type { LinterHost } from "../types/host.ts";
import type { LanguageReport } from "../types/languages.ts";
import type { FileReport } from "../types/reports.ts";
import type { LanguageAndFile } from "./types.ts";

const log = debugForFile(import.meta.filename);

/**
 * For a single file path, collects its:
 *   - Cache dependencies: from each language file
 *   - LanguageReport: from each language file (if not skipped)
 *   - Reports: from rules reports by file path
 * ...and then disposes of each language file.
 */
export function finalizeFileResults(
	filePath: string,
	languageAndFiles: LanguageAndFile[],
	reports: FileReport[],
	host: LinterHost,
	skipLanguageReports?: boolean,
) {
	const directivesFilterer = new DirectivesFilterer();
	const fileDependencies = new Set<string>();
	const languageReports: LanguageReport[] = [];

	for (const { file, language } of languageAndFiles) {
		if (file.directives) {
			log("Adding %d directives for file %s", file.directives.length, filePath);
			directivesFilterer.add(file.directives);
		}

		const cache = language.getFileCacheImpacts?.(file);

		if (cache?.dependencies) {
			for (const dependency of cache.dependencies) {
				const normalized = pathKey(
					resolve(dependency),
					host.isCaseSensitiveFS(),
				);
				if (!fileDependencies.has(normalized)) {
					log("Adding file dependency %s for file %s", normalized, filePath);
					fileDependencies.add(normalized);
				}
			}
		}

		if (!skipLanguageReports && language.getLanguageReports) {
			log(
				"Retrieving %s language reports for file %s",
				language.about.name,
				filePath,
			);
			languageReports.push(...language.getLanguageReports(file));
			log(
				"Retrieved %s language reports for file %s",
				language.about.name,
				filePath,
			);
		}
	}

	const directiveReportsFromCollector: FileReport[] = [];
	for (const { file } of languageAndFiles) {
		if (file.reports) {
			directiveReportsFromCollector.push(...file.reports);
		}
	}

	const filterResult = directivesFilterer.filter(reports);

	const unusedDirectiveReports = filterResult.unusedDirectives.map(
		(directive) => directiveReports.createUnused(directive),
	);

	return {
		dependencies: fileDependencies,
		languageReports,
		reports: [
			...filterResult.reports,
			...directiveReportsFromCollector,
			...unusedDirectiveReports,
		],
	};
}
