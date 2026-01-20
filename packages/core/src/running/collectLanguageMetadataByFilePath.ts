import { makeAbsolute, nullThrows } from "@flint.fyi/utils";
import { CachedFactory } from "cached-factory";

import type { FileCacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import type {
	AnyLanguage,
	AnyLanguageFileMetadata,
} from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";

export function collectLanguageMetadataByFilePath(
	cached: Map<string, FileCacheStorage> | undefined,
	rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
	host: LinterHost,
) {
	const languageFileMetadataByFilePath = new CachedFactory<
		string,
		Map<AnyLanguage, AnyLanguageFileMetadata>
	>(() => new Map());

	const languageFilesMetadataByLanguage = new CachedFactory(
		(language: AnyLanguage) => {
			const fileFactory = language.createFileFactory(host);

			return new CachedFactory((filePath: string) =>
				fileFactory.prepareFile({
					filePath,
					filePathAbsolute: makeAbsolute(filePath),
					sourceText: nullThrows(
						host.readFile(filePath),
						`Expected ${filePath} to exist`,
					),
				}),
			);
		},
	);

	for (const [rule, optionsByFile] of rulesOptionsByFile) {
		for (const [filePath] of optionsByFile) {
			// If the file has cached results, don't bother making files for it
			if (cached?.has(filePath)) {
				continue;
			}

			const fileMetadata = languageFilesMetadataByLanguage
				.get(rule.language)
				.get(filePath);

			languageFileMetadataByFilePath
				.get(filePath)
				.set(rule.language, fileMetadata);
		}
	}

	return new Map(
		Array.from(languageFileMetadataByFilePath.entries()).map(
			([filePath, fileMetadataByLanguage]) => [
				filePath,
				Array.from(fileMetadataByLanguage.entries()).map(
					([language, fileMetadata]) => ({
						fileMetadata,
						language,
					}),
				),
			],
		),
	);
}
