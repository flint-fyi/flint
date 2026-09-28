import { readFromCache } from "../cache/readFromCache.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectLanguageFilesByFilePath } from "./collectLanguageFilesByFilePath.ts";
import { collectRulesOptionsByFile } from "./collectRulesOptionsByFile.ts";
import { computeUseDefinitions } from "./computeUseDefinitions.ts";
import type { LanguageAndFile } from "./types.ts";

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
	 * For each rule, the options it's enabled with on each of its file paths.
	 */
	rulesOptionsByFile: Map<AnyRule, Map<string, object>>;
}

export async function collectFilesAndOptions(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	ignoreCache: boolean | undefined,
	cacheLocationOverride: string | undefined,
): Promise<CollectedFilesAndOptions> {
	// 1. Collect all file paths to lint and the 'use' rule configuration groups
	const { allFilePaths, useDefinitions } = await computeUseDefinitions(
		host,
		configDefinition,
	);

	// 2. Retrieve any past cached results from those files
	const cached = ignoreCache
		? undefined
		: await readFromCache(
				host,
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

	return {
		allFilePaths,
		cached,
		languageFilesByFilePath,
		rulesOptionsByFile,
	};
}
