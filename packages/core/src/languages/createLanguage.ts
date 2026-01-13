import { debugForFile } from "debug-for-file";

import type {
	FileAboutData,
	FileDiskData,
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

		createFileFactory() {
			log(
				"Creating file factory for language: %s",
				languageDefinition.about.name,
			);

			const fileFactoryDefinition = languageDefinition.createFileFactory();

			log("Created file factory.");

			const fileFactory = makeDisposable({
				...fileFactoryDefinition,
				prepareFromDisk: (data: FileAboutData) => {
					const { file, ...rest } = fileFactoryDefinition.prepareFromDisk(data);

					return {
						file: makeDisposable(file),
						...rest,
					};
				},
				prepareFromVirtual: (data: FileDiskData) => {
					const { file, ...rest } =
						fileFactoryDefinition.prepareFromVirtual(data);

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
