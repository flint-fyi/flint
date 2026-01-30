import { makeAbsolute, nullThrows } from "@flint.fyi/utils";
import { CachedFactory } from "cached-factory";

import type { FileCacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import type { AnyLanguage, AnyLanguageFile } from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";

export function collectLanguageFilesByFilePath(
	cached: Map<string, FileCacheStorage> | undefined,
	rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
	host: LinterHost,
) {
	const languageFilesByFilePath = new CachedFactory<
		string,
		Map<AnyLanguage, AnyLanguageFile>
	>(() => new Map());

	const languageFilesByLanguage = new CachedFactory((language: AnyLanguage) => {
		const fileFactory = language.createFileFactory(host);

		return new CachedFactory((filePath: string) =>
			fileFactory.createFile({
				filePath,
				filePathAbsolute: makeAbsolute(filePath),
				sourceText: nullThrows(
					host.readFile(filePath),
					`Expected ${filePath} to exist`,
				),
			}),
		);
	});

	for (const [rule, optionsByFile] of rulesOptionsByFile) {
		for (const [filePath] of optionsByFile) {
			// If the file has cached results, don't bother making files for it
			if (cached?.has(filePath)) {
				continue;
			}

			const file = languageFilesByLanguage.get(rule.language).get(filePath);

			languageFilesByFilePath.get(filePath).set(rule.language, file);
		}
	}

	return new Map(
		Array.from(languageFilesByFilePath.entries()).map(
			([filePath, filesByLanguage]) => [
				filePath,
				Array.from(filesByLanguage.entries()).map(([language, file]) => ({
					file,
					language,
				})),
			],
		),
	);
}
