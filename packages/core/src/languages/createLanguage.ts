import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";

import { parseOptions } from "../running/parseOptions.ts";
import type { LinterHost } from "../types/host.ts";
import type {
	FileAboutData,
	FileVisitors,
	Language,
	LanguageCreateRule,
	LanguageDefinition,
	LanguageFile,
	LanguageFileDefinition,
} from "../types/languages.ts";
import type { Rule, RuleAbout, RuleDefinition } from "../types/rules.ts";
import type { AnyOptionalSchema } from "../types/shapes.ts";
import { makeDisposable } from "./makeDisposable.ts";

const log = debugForFile(import.meta.url);

/**
 * A file this language created, along with the visitors rules have added for it.
 */
interface FileState<AstNodesByName, FileServices extends object> {
	definition: LanguageFileDefinition<FileServices>;
	fileVisitors: FileVisitors<AstNodesByName, FileServices>[];
}

export function createLanguage<
	AstNodesByName,
	FileServices extends object = object,
>(
	languageDefinition: LanguageDefinition<AstNodesByName, FileServices>,
): Language<AstNodesByName, FileServices> {
	const { getFileCacheImpacts, getLanguageReports, runFileVisitors } =
		languageDefinition;

	// Rules find their typed file state here, since the linter only passes them a LanguageFile.
	const fileStates = new WeakMap<
		LanguageFile,
		FileState<AstNodesByName, FileServices>
	>();

	function createRuleWithServices<Extra extends object>(
		noExtraServices: Partial<Extra>,
	): LanguageCreateRule<AstNodesByName, FileServices & Partial<Extra>> {
		return function createRule<
			const About extends RuleAbout,
			const MessageId extends string,
			OptionsSchema extends AnyOptionalSchema | undefined = undefined,
		>(
			ruleDefinition: RuleDefinition<
				About,
				AstNodesByName,
				FileServices & Partial<Extra>,
				MessageId,
				OptionsSchema
			>,
		): Rule<About, MessageId, OptionsSchema> {
			return {
				about: ruleDefinition.about,
				language,
				messages: ruleDefinition.messages,
				...(ruleDefinition.options && { options: ruleDefinition.options }),

				async setup(context) {
					const runtime = await ruleDefinition.setup(context);
					if (!runtime) {
						return;
					}

					const { visitors, ...rest } = runtime;
					if (!visitors) {
						return rest;
					}

					const schema = ruleDefinition.options;
					const parsedOptionsByOptions =
						schema &&
						new CachedFactory((options: unknown) =>
							parseOptions<OptionsSchema>(schema, options),
						);

					return {
						...rest,
						addFileVisitors(file, options) {
							const state = fileStates.get(file);
							if (!state) {
								throw new Error(
									`Rule "${ruleDefinition.about.id}" was given a file not created by the ${languageDefinition.about.name} language.`,
								);
							}

							const services = {
								options: parsedOptionsByOptions
									? parsedOptionsByOptions.get(options)
									: parseOptions<OptionsSchema>(undefined, options),
								...noExtraServices,
								...state.definition.services,
							};

							state.fileVisitors.push((use) => use(services, visitors));
						},
					};
				},
			};
		};
	}

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
					const definition = fileFactoryDefinition.createFile(data);
					const state: FileState<AstNodesByName, FileServices> = {
						definition,
						fileVisitors: [],
					};
					const file: LanguageFile = {
						...makeDisposable(definition),
						...(getFileCacheImpacts && {
							getFileCacheImpacts: (host: LinterHost) =>
								getFileCacheImpacts(definition, host),
						}),
						...(getLanguageReports && {
							getLanguageReports: (host: LinterHost) =>
								getLanguageReports(definition, host),
						}),
						runFileVisitors: () => {
							if (!state.fileVisitors.length) {
								return;
							}

							runFileVisitors(definition, state.fileVisitors);
							state.fileVisitors = [];
						},
					};

					fileStates.set(file, state);

					return file;
				},
			};

			log("Created file factory.");

			return fileFactory;
		},

		createRule: createRuleWithServices({}),

		extendServices<Extra extends object>() {
			const noExtraServices: Partial<Extra> = {};

			return {
				...language,
				createRule: createRuleWithServices(noExtraServices),
			};
		},
	};

	return language;
}
