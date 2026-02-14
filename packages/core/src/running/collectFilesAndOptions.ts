import { nullThrows } from "@flint.fyi/utils";

import { readFromCache } from "../cache/readFromCache.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectLanguageFilesByFilePath } from "./collectLanguageFilesByFilePath.ts";
import { collectRulesOptionsByFile } from "./collectRulesOptionsByFile.ts";
import { computeUseDefinitions } from "./computeUseDefinitions.ts";
import type { LanguageAndFile, LanguageFilesWithOptions } from "./types.ts";

/**
 * Collected information describing files to lint, along with rule options.
 */
export interface CollectedFilesAndOptions {
	/**
	 * All file paths the user wants linted, including any previously cached ones.
	 */
	allFilePaths: Set<string>;

	/**
	 * Previously existing cache, if one could be found.
	 */
	cached: Map<string, FileCacheStorage> | undefined;

	/**
	 * For each file path, all prepared language files representing it.
	 */
	languageFilesByFilePath: Map<string, LanguageAndFile[]>;

	/**
	 * For each rule, the array of files to lint with which options.
	 * @remarks
	 * Note that this should not include cached files.
	 * Those files don't need to have language files or options computed.
	 */
	rulesFilesAndOptionsByRule: Map<AnyRule, LanguageFilesWithOptions[]>;
}

// TODO: This is very slow and the whole thing should be refactored 🙌.
// Creating arrays and Maps and Sets per rule x per file is a lot of memory!
export async function collectFilesAndOptions(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	ignoreCache: boolean | undefined,
	cacheLocationOverride: string | undefined,
): Promise<CollectedFilesAndOptions> {
	// 1. Collect all file paths to lint and the 'use' rule configuration groups
	const { allFilePaths, useDefinitions } = await computeUseDefinitions(
		configDefinition,
		host,
	);

	// 2. Retrieve any past cached results from those files
	const cached = ignoreCache
		? undefined
		: await readFromCache(
				allFilePaths,
				configDefinition.filePath,
				cacheLocationOverride,
			);

	// 3. For each rule, create a map of the files it's enabled on & with which options
	const rulesOptionsByFile = collectRulesOptionsByFile(useDefinitions);

	// 4. Collect metadata for each linted file on its enabled rules' languages
	const languageFilesByFilePath = collectLanguageFilesByFilePath(
		cached,
		rulesOptionsByFile,
		host,
	);

	// 5. Join language metadata files into the corresponding options by file path
	const rulesFilesAndOptionsByRule = new Map(
		Array.from(rulesOptionsByFile).map(([rule, optionsByFile]) => [
			rule,
			Array.from(optionsByFile)
				.filter(([filePath]) => languageFilesByFilePath.has(filePath))
				.map(([filePath, options]) => ({
					languageFiles: Array.from(
						nullThrows(
							languageFilesByFilePath.get(filePath),
							"Language file is expected to be present by the map",
						).values(),
					),
					options,
				})),
		]),
	);

	return {
		allFilePaths,
		cached,
		languageFilesByFilePath,
		rulesFilesAndOptionsByRule,
	};
}
