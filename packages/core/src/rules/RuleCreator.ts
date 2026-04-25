import type {
	AnyLanguage,
	GetLanguageAstNodesByName,
	GetLanguageFileServices,
} from "../types/languages.ts";
import type { Rule, RuleAbout, RuleDefinition } from "../types/rules.ts";
import type { AnyOptionalSchema } from "../types/shapes.ts";

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
		const About extends RuleAbout<Presets>,
		const Language extends AnyLanguage,
		const MessageId extends string,
	>(
		language: Language,
		rule: RuleDefinition<
			About,
			GetLanguageAstNodesByName<Language>,
			GetLanguageFileServices<Language>,
			MessageId,
			undefined
		>,
	): Rule<
		About & { pluginId: string; url: string },
		object,
		object,
		MessageId,
		undefined
	>;
	createRule<
		const About extends RuleAbout<Presets>,
		const Language extends AnyLanguage,
		const MessageId extends string,
		const OptionsSchema extends AnyOptionalSchema,
	>(
		language: Language,
		rule: RuleDefinition<
			About,
			GetLanguageAstNodesByName<Language>,
			GetLanguageFileServices<Language>,
			MessageId,
			OptionsSchema
		>,
	): Rule<
		About & { pluginId: string; url: string },
		object,
		object,
		MessageId,
		OptionsSchema
	>;
	createRule<
		const About extends RuleAbout<Presets>,
		const Language extends AnyLanguage,
		const MessageId extends string,
		const OptionsSchema extends AnyOptionalSchema | undefined,
	>(
		language: Language,
		rule: RuleDefinition<
			About,
			GetLanguageAstNodesByName<Language>,
			GetLanguageFileServices<Language>,
			MessageId,
			OptionsSchema
		>,
	): Rule<
		About & { pluginId: string; url: string },
		object,
		object,
		MessageId,
		OptionsSchema
	> {
		return (
			language.createRule as (
				definition: RuleDefinition<
					About & { pluginId: string; url: string },
					GetLanguageAstNodesByName<Language>,
					GetLanguageFileServices<Language>,
					MessageId,
					OptionsSchema
				>,
			) => Rule<
				About & { pluginId: string; url: string },
				object,
				object,
				MessageId,
				OptionsSchema
			>
		)({
			...rule,
			about: {
				...rule.about,
				pluginId: this.#options.pluginId,
				url: this.#options.docs(rule.about.id),
			},
		});
	}
}
