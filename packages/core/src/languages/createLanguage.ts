import { debugForFile } from "debug-for-file";

import type {
	FileAboutData,
	Language,
	LanguageCreateRule,
	LanguageDefinition,
} from "../types/languages.ts";
import type { AnyRuleDefinition } from "../types/rules.ts";
import { makeDisposable } from "./makeDisposable.ts";

const log = debugForFile(import.meta.filename);

export function createLanguage<
	AstNodesByName,
	FileServices extends object = object,
>(languageDefinition: LanguageDefinition<AstNodesByName, FileServices>) {
	const language: Language<AstNodesByName, FileServices> = {
		...languageDefinition,

		createFileFactory(host) {
			log(
				"Creating file factory for language: %s",
				languageDefinition.about.name,
			);

			const fileFactoryDefinition = languageDefinition.createFileFactory(host);

			const fileFactory = {
				...fileFactoryDefinition,
				createFile: (data: FileAboutData) => {
					return makeDisposable(fileFactoryDefinition.createFile(data));
				},
			};

			log("Created file factory.");

			return fileFactory;
		},

		createRule: ((ruleDefinition: AnyRuleDefinition) => {
			return {
				...ruleDefinition,
				language,
			};
		}) as LanguageCreateRule<AstNodesByName, FileServices>,
	};

	return language;
}
