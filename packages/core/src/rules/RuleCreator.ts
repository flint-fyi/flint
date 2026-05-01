import type {
	AnyLanguage,
	GetLanguageAstNodesByName,
	GetLanguageFileServices,
} from "../types/languages.ts";
import type { Rule, RuleAbout, RuleDefinition } from "../types/rules.ts";
import type { AnyOptionalSchema } from "../types/shapes.ts";

export interface RuleCreatorOptions {
	docs: (ruleId: string) => string;
	pluginId: string;
}

type ExactRuleAbout<Value, Shape> = Record<
	Exclude<keyof Value, keyof Shape>,
	never
> &
	Value;

export class RuleCreator<About extends RuleAbout> {
	#options: RuleCreatorOptions;

	constructor(options: RuleCreatorOptions) {
		this.#options = options;
	}

	createRule<
		const Language extends AnyLanguage,
		const RuleDefinitionAbout extends About,
		const MessageId extends string,
		OptionsSchema extends AnyOptionalSchema | undefined = undefined,
	>(
		language: Language,
		rule: RuleDefinition<
			ExactRuleAbout<RuleDefinitionAbout, About>,
			GetLanguageAstNodesByName<Language>,
			GetLanguageFileServices<Language>,
			MessageId,
			OptionsSchema
		>,
	): Rule<
		RuleDefinitionAbout & { pluginId: string; url: string },
		MessageId,
		OptionsSchema
	> {
		// Use RuleCreator.createRule instead of Language.createRule
		// But this is the original implementation
		// flint-disable-next-line flint/ruleCreationMethods
		return language.createRule({
			...rule,
			about: {
				...rule.about,
				pluginId: this.#options.pluginId,
				url: this.#options.docs(rule.about.id),
			},
		});
	}
}
