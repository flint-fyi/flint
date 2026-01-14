import { debugForFile } from "debug-for-file";

import { DirectivesFilterer } from "../directives/DirectivesFilterer.ts";
import type { LanguageFileDiagnostic } from "../types/languages.ts";
import type { FileReport } from "../types/reports.ts";
import type { LanguageAndFilesMetadata } from "./types.ts";

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
	languageAndFilesMetadata: LanguageAndFilesMetadata[],
	reports: FileReport[],
	skipDiagnostics?: boolean,
) {
	const directivesFilterer = new DirectivesFilterer();
	const fileDependencies = new Set<string>();
	const fileDiagnostics: LanguageFileDiagnostic[] = [];

	for (const { fileMetadata, language } of languageAndFilesMetadata) {
		if (fileMetadata.directives) {
			log(
				"Adding %d directives for file %s",
				fileMetadata.directives,
				filePath,
			);
			directivesFilterer.add(fileMetadata.directives);
		}

		if (fileMetadata.file.cache?.dependencies) {
			for (const dependency of fileMetadata.file.cache.dependencies) {
				if (!fileDependencies.has(dependency)) {
					log("Adding file dependency %s for file %s", dependency, filePath);
					fileDependencies.add(dependency);
				}
			}
		}

		if (!skipDiagnostics) {
			if (fileMetadata.file.getDiagnostics) {
				log(
					"Retrieving language %s diagnostics for file %s",
					language.about.name,
					filePath,
				);
				fileDiagnostics.push(...fileMetadata.file.getDiagnostics());
				log(
					"Retrieved language %s diagnostics for file %s",
					language.about.name,
					filePath,
				);
			}
		}

		log("Disposing language %s for file %s", language.about.name, filePath);
		fileMetadata.file[Symbol.dispose]();
		log("Disposed language %s for file %s", language.about.name, filePath);
	}

	return {
		dependencies: fileDependencies,
		diagnostics: fileDiagnostics,
		reports: directivesFilterer.filter(reports),
	};
}
