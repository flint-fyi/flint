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

export function createLanguage<AstNodesByName, FileServices extends object>(
	languageDefinition: LanguageDefinition<AstNodesByName, FileServices>,
) {
	const language: Language<AstNodesByName, FileServices> = {
		...languageDefinition,

		createFileFactory(host) {
			log(
				"Creating file factory for language: %s",
				languageDefinition.about.name,
			);

			const fileFactoryDefinition = languageDefinition.createFileFactory(host);

			log("Created file factory.");

			const fileFactory = makeDisposable({
				...fileFactoryDefinition,
				prepareFile: (data: FileAboutData) => {
					const { file, ...rest } = fileFactoryDefinition.prepareFile(data);

					return {
						file: makeDisposable(file),
						...rest,
					};
				},
			});

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
