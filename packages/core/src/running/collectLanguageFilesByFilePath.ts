import { CachedFactory } from "cached-factory";

import { makeAbsolute, nullThrows } from "@flint.fyi/utils";

import type { FileCacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import type { AnyLanguage, AnyLanguageFile } from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";

export function collectLanguageFilesByFilePath(
	cached: Map<string, FileCacheStorage> | undefined,
	rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
	host: LinterHost,
	resources: DisposableStack,
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

	const languageFactories = new CachedFactory((language: AnyLanguage) => {
		const fileFactory = resources.use(language.createFileFactory(host));

		const filesByPath = new CachedFactory((filePath: string) =>
			resources.use(
				fileFactory.createFile({
					filePath,
					filePathAbsolute: makeAbsolute(filePath),
					sourceText: nullThrows(
						// TODO: switch to read this async
						host.readFileSync(filePath),
						`Expected ${filePath} to exist`,
					),
				}),
			),
		);

		return { fileFactory, filesByPath };
	});

	for (const [rule, optionsByFile] of rulesOptionsByFile) {
		for (const [filePath] of optionsByFile) {
			// If the file has cached results, don't bother making files for it
			if (cached?.has(filePath)) {
				continue;
			}

			filePathsByLanguage.get(rule.language).add(filePath);
			languageFilesByFilePath.get(filePath).set(rule.language, undefined);
		}
	}

	for (const [language, filePaths] of filePathsByLanguage.entries()) {
		const { fileFactory, filesByPath } = languageFactories.get(language);
		const orderedFilePaths = language.orderFilePaths
			? language.orderFilePaths([...filePaths], host)
			: [...filePaths];

		// Give whole-program languages (e.g. TypeScript) the chance to open every
		// file at once, so the per-file `createFile` calls below become cheap
		// lookups against a stable program instead of rebuilding it per file.
		fileFactory.prepareFiles?.(orderedFilePaths.map(makeAbsolute));

		for (const filePath of orderedFilePaths) {
			languageFilesByFilePath
				.get(filePath)
				.set(language, filesByPath.get(filePath));
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
