import type {
	AnyLanguage,
	GetLanguageAstNodesByName,
	GetLanguageFileServices,
} from "../types/languages.ts";
import type { Rule, RuleAbout, RuleDefinition } from "../types/rules.ts";
import type { AnyOptionalSchema } from "../types/shapes.ts";

export interface RuleAboutWithPresets<
	Presets extends string,
> extends RuleAbout {
	presets?: Presets[];
}

export interface RuleAboutWithPresetsAndUrl<
	Presets extends string,
> extends RuleAboutWithPresets<Presets> {
	url: string;
}

export interface RuleCreatorOptions<Presets extends string> {
	docs: (ruleId: string) => string;
	pluginId: string;
	presets: Presets[];
}

export class RuleCreator<Presets extends string> {
	#options: RuleCreatorOptions<Presets>;

	constructor(options: RuleCreatorOptions<Presets>) {
		this.#options = options;
	}

	createRule<
		const Language extends AnyLanguage,
		const MessageId extends string,
		const OptionsSchema extends AnyOptionalSchema,
	>(
		language: Language,
		rule: RuleDefinition<
			RuleAboutWithPresets<Presets>,
			GetLanguageAstNodesByName<Language>,
			GetLanguageFileServices<Language>,
			MessageId,
			OptionsSchema
		>,
	): Rule<
		RuleAboutWithPresetsAndUrl<Presets>,
		GetLanguageAstNodesByName<Language>,
		GetLanguageFileServices<Language>,
		MessageId,
		OptionsSchema
	> {
		return language.createRule({
			...rule,
			about: {
				...rule.about,
				url: this.#options.docs(rule.about.id),
			},
		});
	}
}
