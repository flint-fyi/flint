import { debugForFile } from "debug-for-file";

import type { LinterHost } from "../types/host.ts";
import type {
	FileAboutData,
	FileVisitors,
	Language,
	LanguageDefinition,
	LanguageFile,
} from "../types/languages.ts";
import { makeDisposable } from "./makeDisposable.ts";

const log = debugForFile(import.meta.url);

export function createLanguage<
	AstNodesByName,
	FileServices extends object = object,
>(
	languageDefinition: LanguageDefinition<AstNodesByName, FileServices>,
): Language<AstNodesByName, FileServices> {
	const { getFileCacheImpacts, getLanguageReports, runFileVisitors } =
		languageDefinition;

	const language: Language<AstNodesByName, FileServices> = {
		about: languageDefinition.about,
		...(languageDefinition.orderFilePaths && {
			orderFilePaths: languageDefinition.orderFilePaths,
		}),

		createFileFactory(host) {
			log(
				"Creating file factory for language: %s",
				languageDefinition.about.name,
			);

			const fileFactoryDefinition = languageDefinition.createFileFactory(host);

			const fileFactory = {
				...fileFactoryDefinition,
				createFile: (data: FileAboutData) => {
					const file: LanguageFile<FileServices> = {
						...makeDisposable(fileFactoryDefinition.createFile(data)),
						...(getFileCacheImpacts && {
							getFileCacheImpacts: (host: LinterHost) =>
								getFileCacheImpacts(file, host),
						}),
						...(getLanguageReports && {
							getLanguageReports: (host: LinterHost) =>
								getLanguageReports(file, host),
						}),
						runFileVisitors: (fileVisitors) => {
							// Visitors arrive erased from the runner, which pairs them with this file by rule.language.
							// Removing this cast needs rules to carry their language's types (see #4126's follow-up).
							runFileVisitors(
								file,
								fileVisitors as readonly FileVisitors<
									AstNodesByName,
									FileServices
								>[],
							);
						},
					};

					return file;
				},
			};

			log("Created file factory.");

			return fileFactory;
		},

		createRule(ruleDefinition) {
			return {
				...ruleDefinition,
				language,
			};
		},
	};

	return language;
}
