import { CachedFactory } from "cached-factory";
import { resolve } from "pathe";

import { nullThrows } from "@flint.fyi/utils";

import type { LinterHost } from "../types/host.ts";
import type {
	AnyLanguage,
	AnyLanguageFile,
	AnyLanguageFileFactory,
} from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";

export function collectLanguageFilesByFilePath(
	rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
	host: LinterHost,
	filePaths: ReadonlySet<string>,
	languageFileFactories: CachedFactory<AnyLanguage, AnyLanguageFileFactory>,
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
		Map<AnyLanguage, AnyLanguageFile>
	>(() => new Map());

	for (const [rule, optionsByFile] of rulesOptionsByFile) {
		for (const [filePath] of optionsByFile) {
			if (!filePaths.has(filePath)) {
				continue;
			}

			filePathsByLanguage.get(rule.language).add(filePath);
			// Reserves the file's place, so results keep discovery order even
			// when a language creates its files in a different order.
			languageFilesByFilePath.get(filePath);
		}
	}

	for (const [language, filePaths] of filePathsByLanguage.entries()) {
		const languageFileFactory = languageFileFactories.get(language);
		const orderedFilePaths = language.orderFilePaths
			? language.orderFilePaths([...filePaths], host)
			: [...filePaths];

		// Give whole-program languages (e.g. TypeScript) the chance to open every
		// file at once, so the per-file `createFile` calls below become cheap
		// lookups against a stable program instead of rebuilding it per file.
		languageFileFactory.prepareFiles?.(
			orderedFilePaths.map((filePath) =>
				resolve(host.getCurrentDirectory(), filePath),
			),
		);

		for (const filePath of orderedFilePaths) {
			languageFilesByFilePath.get(filePath).set(
				language,
				languageFileFactory.createFile({
					filePath,
					filePathAbsolute: resolve(host.getCurrentDirectory(), filePath),
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
		Array.from(
			languageFilesByFilePath.entries(),
			([filePath, filesByLanguage]) => [
				filePath,
				Array.from(filesByLanguage, ([language, file]) => ({
					file,
					language,
				})),
			],
		),
	);
}
