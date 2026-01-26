import { debugForFile } from "debug-for-file";

import { DirectivesFilterer } from "../directives/DirectivesFilterer.ts";
import type { LanguageFileDiagnostic } from "../types/languages.ts";
import type { FileReport } from "../types/reports.ts";
import type { LanguageAndFile } from "./types.ts";

const log = debugForFile(import.meta.filename);

/**
 * For a single file path, collects its:
 *   - Cache dependencies: from each language file
 *   - Diagnostics: from each language file (if not skipped)
 *   - Reports: from rules reports by file path
 * ...and then disposes of each language file.
 */
export function finalizeFileResults(
	filePath: string,
	languageAndFiles: LanguageAndFile[],
	reports: FileReport[],
	skipDiagnostics?: boolean,
) {
	const directivesFilterer = new DirectivesFilterer();
	const fileDependencies = new Set<string>();
	const fileDiagnostics: LanguageFileDiagnostic[] = [];

	for (const { file, language } of languageAndFiles) {
		if (file.directives) {
			log("Adding %d directives for file %s", file.directives, filePath);
			directivesFilterer.add(file.directives);
		}

		const cache = language.getFileCacheImpacts?.(file);

		if (cache?.dependencies) {
			for (const dependency of cache.dependencies) {
				if (!fileDependencies.has(dependency)) {
					log("Adding file dependency %s for file %s", dependency, filePath);
					fileDependencies.add(dependency);
				}
			}
		}

		if (!skipDiagnostics) {
			if (language.getFileDiagnostics) {
				log(
					"Retrieving language %s diagnostics for file %s",
					language.about.name,
					filePath,
				);
				fileDiagnostics.push(...language.getFileDiagnostics(file));
				log(
					"Retrieved language %s diagnostics for file %s",
					language.about.name,
					filePath,
				);
			}
		}
	}

	return {
		dependencies: fileDependencies,
		diagnostics: fileDiagnostics,
		reports: directivesFilterer.filter(reports),
	};
}
