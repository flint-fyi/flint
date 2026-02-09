import { CachedFactory } from "cached-factory";

import { writeToCache } from "../cache/writeToCache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import type { FileReport } from "../types/reports.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectFilesAndOptions } from "./collectFilesAndOptions.ts";
import { finalizeFileResults } from "./finalizeFileResults.ts";
import { runLintRule } from "./runLintRule.ts";
import type { LanguageAndFile, LanguageFilesWithOptions } from "./types.ts";
import type { Language } from "../types/languages.ts";
import { assert } from "@flint.fyi/utils";

export interface RunConfigOptions {
	cacheLocation?: string | undefined;
	ignoreCache?: boolean;
	skipDiagnostics?: boolean;
}

export async function runConfig(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	{
		cacheLocation: cacheLocationFromCli,
		ignoreCache,
		skipDiagnostics,
	}: RunConfigOptions,
): Promise<LintResults> {
	const cacheLocationOverride =
		cacheLocationFromCli || configDefinition.cacheLocation;

	// 1. Based on the original config definition, collect:
	//   - The full list of all file paths to be linted
	//   - Any cached results amongst those file paths
	//   - The language (virtual) file representations
	//   - For each rule, the options it'll run with on each of its files
	const {
		allFilePaths,
		cached,
		languageFilesByFilePath,
		rulesFilesAndOptionsByRule,
	} = await collectFilesAndOptions(
		configDefinition,
		host,
		ignoreCache,
		cacheLocationOverride,
	);

	// 2. For each lint rule, run it on all files and store each file's results
	const reportsByFilePath = await runRules(
		rulesFilesAndOptionsByRule,
		languageFilesByFilePath,
	);

	// 3. For each file path, finalize output using each of its language files
	const filesResults = new Map(
		Array.from(languageFilesByFilePath).map(([filePath, languageAndFiles]) => [
			filePath,
			finalizeFileResults(
				filePath,
				languageAndFiles,
				reportsByFilePath.get(filePath).flat(),
				skipDiagnostics,
			),
		]),
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

	await writeToCache(
		configDefinition.filePath,
		lintResults,
		cacheLocationOverride,
	);

	return lintResults;
}

async function runRules(
	rulesFilesAndOptionsByRule: Map<AnyRule, LanguageFilesWithOptions[]>,
	languageFilesByFilePath: Map<string, LanguageAndFile[]>,
) {
	const reportsByFilePath = new CachedFactory<
		string,
		CachedFactory<Language<unknown, object>, FileReport[]>
	>(() => new CachedFactory(() => []));

	for (const [rule, filesAndOptions] of rulesFilesAndOptionsByRule) {
		const ruleReportsByFilePath = await runLintRule(rule, filesAndOptions);

		for (const [filePath, ruleReports] of ruleReportsByFilePath) {
			reportsByFilePath
				.get(filePath)
				.get(rule.language)
				.push(...ruleReports);
		}
	}

	return new CachedFactory<string, FileReport[]>((filePath) => {
		const reports: FileReport[] = [];
		const languageFiles = languageFilesByFilePath.get(filePath);
		for (const [language, fileReports] of reportsByFilePath
			.get(filePath)
			.entries()) {
			// TODO: support for cross-language rules
			// https://github.com/flint-fyi/flint/issues/1253#issuecomment-3869997023
			if (languageFiles != null) {
				const relatedLanguageFiles = languageFiles
					.filter((f) => f.language === language)
					.map((f) => f.file);
				// TODO: is this correct?
				// assert(relatedLanguageFiles.length <= 1, '')
				const file = relatedLanguageFiles[0]!;
				reports.push(...(file.adjustReports?.(fileReports) ?? fileReports));
			} else {
				reports.push(...fileReports);
			}
		}
		return reports;
	});
}
