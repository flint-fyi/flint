import { CachedFactory } from "cached-factory";

import { writeToCache } from "../cache/writeToCache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LintResults } from "../types/linting.ts";
import type { FileReport } from "../types/reports.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectFilesAndMetadata } from "./collectFilesAndMetadata.ts";
import { finalizeFileResults } from "./finalizeFileResults.ts";
import { runLintRule } from "./runLintRule.ts";
import type { LanguageFilesWithOptions } from "./types.ts";

export interface RunConfigOptions {
	ignoreCache?: boolean;
	skipDiagnostics?: boolean;
}

export async function runConfig(
	configDefinition: ProcessedConfigDefinition,
	{ ignoreCache, skipDiagnostics }: RunConfigOptions,
): Promise<LintResults> {
	// 1. Based on the original config definition, collect:
	//   - The full list of all file paths to be linted
	//   - Any cached results amongst those file paths
	//   - The language (virtual) file representations
	//   - For each rule, the options it'll run with on each of its files
	const {
		allFilePaths,
		cached,
		languageFileMetadataByFilePath,
		rulesFilesAndOptionsByRule,
	} = await collectFilesAndMetadata(configDefinition, ignoreCache);

	// 2. For each lint rule, run it on all files and store each file's results
	const reportsByFilePath = await runRules(rulesFilesAndOptionsByRule);

	// 3. For each file path, finalize output using its language metadata files
	const filesResults = new Map(
		Array.from(languageFileMetadataByFilePath).map(
			([filePath, languageAndFilesMetadata]) => [
				filePath,
				finalizeFileResults(
					filePath,
					languageAndFilesMetadata,
					reportsByFilePath.get(filePath).flat(),
					skipDiagnostics,
				),
			],
		),
	);

	// 4. Merge cached file results into filesResults
	if (cached) {
		for (const [filePath, cachedStorage] of cached) {
			filesResults.set(filePath, {
				dependencies: new Set(cachedStorage.dependencies),
				diagnostics: cachedStorage.diagnostics ?? [],
				reports: cachedStorage.reports ?? [],
			});
		}
	}

	// 5. Write the results to cache, then return them! We did it!
	const lintResults = { allFilePaths, cached, filesResults };

	await writeToCache(configDefinition.filePath, lintResults);

	return lintResults;
}

async function runRules(
	rulesFilesAndOptionsByRule: Map<AnyRule, LanguageFilesWithOptions[]>,
) {
	const reportsByFilePath = new CachedFactory<string, FileReport[]>(() => []);

	for (const [rule, filesAndOptions] of rulesFilesAndOptionsByRule) {
		const ruleReportsByFilePath = await runLintRule(rule, filesAndOptions);

		for (const [filePath, ruleReports] of ruleReportsByFilePath) {
			reportsByFilePath.get(filePath).push(...ruleReports);
		}
	}

	return reportsByFilePath;
}
