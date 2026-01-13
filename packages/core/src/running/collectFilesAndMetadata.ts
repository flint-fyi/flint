import { nullThrows } from "@flint.fyi/utils";

import { readFromCache } from "../cache/readFromCache.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectLanguageMetadataByFilePath } from "./collectLanguageMetadataByFilePath.ts";
import { collectRulesOptionsByFile } from "./collectRulesOptionsByFile.ts";
import { computeUseDefinitions } from "./computeUseDefinitions.ts";
import type {
	LanguageAndFilesMetadata,
	LanguageFilesWithOptions,
} from "./types.ts";

/**
 * Collected information describing files to lint, along with metadata and rule options.
 */
export interface CollectedFilesAndMetadata {
	/**
	 * All file paths the user wants linted, including any previously cached ones.
	 */
	allFilePaths: Set<string>;

	/**
	 * Previously existing cache, if one could be found.
	 */
	cached: Map<string, FileCacheStorage> | undefined;

	/**
	 * For each file, all prepared language file metadata wrappers around it.
	 */
	languageFileMetadataByFilePath: Map<string, LanguageAndFilesMetadata[]>;

	/**
	 * For each rule, the array of files to lint with which options.
	 *
	 * Note that this should not include cached files.
	 * Those files don't need to have metadata wrappers or options computed.
	 */
	rulesFilesAndOptionsByRule: Map<AnyRule, LanguageFilesWithOptions[]>;
}

// TODO: This is very slow and the whole thing should be refactored 🙌.
// Creating arrays and Maps and Sets per rule x per file is a lot of memory!
// Also, what if we removed the concept of a virtual file...?
export async function collectFilesAndMetadata(
	configDefinition: ProcessedConfigDefinition,
	ignoreCache: boolean | undefined,
): Promise<CollectedFilesAndMetadata> {
	// 1. Collect all file paths to lint and the 'use' rule configuration groups
	const { allFilePaths, useDefinitions } =
		await computeUseDefinitions(configDefinition);

	// 2. Retrieve any past cached results from those files
	const cached = ignoreCache
		? undefined
		: await readFromCache(allFilePaths, configDefinition.filePath);

	// 3. For each rule, create a map of the files it's enabled on & with which options
	const rulesOptionsByFile = collectRulesOptionsByFile(useDefinitions);

	// 4. Collect metadata for each linted file on its enabled rules' languages
	const languageFileMetadataByFilePath = collectLanguageMetadataByFilePath(
		cached,
		rulesOptionsByFile,
	);

	// 5. Join language metadata files into the corresponding options by file path
	const rulesFilesAndOptionsByRule = new Map(
		Array.from(rulesOptionsByFile).map(([rule, optionsByFile]) => [
			rule,
			Array.from(optionsByFile)
				.filter(([filePath]) => languageFileMetadataByFilePath.has(filePath))
				.map(([filePath, options]) => ({
					languageFiles: Array.from(
						nullThrows(
							languageFileMetadataByFilePath.get(filePath),
							"Language file metadata is expected to be present by the map",
						)
							.values()
							.map((value) => value.fileMetadata.file),
					),
					options,
				})),
		]),
	);

	return {
		allFilePaths,
		cached,
		languageFileMetadataByFilePath,
		rulesFilesAndOptionsByRule,
	};
}
