import { CachedFactory } from "cached-factory";

import { makeAbsolute, nullThrows } from "@flint.fyi/utils";

import type { FileCacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import type {
	AnyLanguage,
	AnyLanguageFile,
	AnyLanguageFileFactory,
} from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";

export interface CollectLanguageFilesOptions {
	cached?: Map<string, FileCacheStorage> | undefined;
	filePaths?: ReadonlySet<string> | undefined;
	languageFileFactories?:
		| CachedFactory<AnyLanguage, AnyLanguageFileFactory>
		| undefined;
}

export function collectLanguageFilesByFilePath(
	rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
	host: LinterHost,
	{
		cached,
		filePaths,
		languageFileFactories = new CachedFactory((language: AnyLanguage) =>
			language.createFileFactory(host),
		),
	}: CollectLanguageFilesOptions = {},
): Map<
	string,
	{
		file: AnyLanguageFile;
		language: AnyLanguage;
	}[]
> {
	const filePathsByLanguage = new CachedFactory<AnyLanguage, Set<string>>(
		() => new Set(),
	);
	const languageFilesByFilePath = new CachedFactory<
		string,
		Map<AnyLanguage, AnyLanguageFile | undefined>
	>(() => new Map());

	for (const [rule, optionsByFile] of rulesOptionsByFile) {
		for (const [filePath] of optionsByFile) {
			// If the file has cached results, don't bother making files for it
			if (cached?.has(filePath) || (filePaths && !filePaths.has(filePath))) {
				continue;
			}

			filePathsByLanguage.get(rule.language).add(filePath);
			languageFilesByFilePath.get(filePath).set(rule.language, undefined);
		}
	}

	for (const [language, filePaths] of filePathsByLanguage.entries()) {
		const languageFileFactory = languageFileFactories.get(language);
		const orderedFilePaths = language.orderFilePaths
			? language.orderFilePaths([...filePaths], host)
			: filePaths;

		for (const filePath of orderedFilePaths) {
			languageFilesByFilePath.get(filePath).set(
				language,
				languageFileFactory.createFile({
					filePath,
					filePathAbsolute: makeAbsolute(filePath),
					sourceText: nullThrows(
						// TODO: switch to read this async
						host.readFileSync(filePath),
						`Expected ${filePath} to exist`,
					),
				}),
			);
		}
	}

	return new Map(
		Array.from(languageFilesByFilePath.entries()).map(
			([filePath, filesByLanguage]) => [
				filePath,
				Array.from(filesByLanguage.entries()).map(([language, file]) => ({
					file: nullThrows(
						file,
						"Language file is expected to be present by the map",
					),
					language,
				})),
			],
		),
	);
}
