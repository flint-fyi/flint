import { CachedFactory } from "cached-factory";
import { resolve } from "pathe";

import { nullThrows } from "@flint.fyi/utils";

import type { LinterHost } from "../types/host.ts";
import type {
	LanguageBase,
	LanguageFile,
	LanguageFileFactory,
} from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";

export function collectLanguageFilesByFilePath(
	rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
	host: LinterHost,
	filePaths: ReadonlySet<string>,
	languageFileFactories: CachedFactory<LanguageBase, LanguageFileFactory>,
): Map<
	string,
	{
		file: LanguageFile;
		language: LanguageBase;
	}[]
> {
	const filePathsByLanguage = new CachedFactory<LanguageBase, Set<string>>(
		() => new Set(),
	);
	const languageFilesByFilePath = new CachedFactory<
		string,
		Map<LanguageBase, LanguageFile>
	>(() => new Map());

	for (const [rule, optionsByFile] of rulesOptionsByFile) {
		for (const [filePath] of optionsByFile) {
			if (!filePaths.has(filePath)) {
				continue;
			}

			filePathsByLanguage.get(rule.language).add(filePath);
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
