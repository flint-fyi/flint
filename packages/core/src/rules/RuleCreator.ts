import type { ExactObject } from "../types/exact.ts";
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
	presets: readonly Presets[];
}

export class RuleCreator<
	Presets extends string,
	const About extends RuleAbout = RuleAbout<Presets>,
> {
	#options: RuleCreatorOptions<Presets>;

	constructor(options: RuleCreatorOptions<Presets>) {
		this.#options = options;
	}

	createRule<
		const RuleDefinitionAbout extends About,
		const Language extends AnyLanguage,
		const MessageId extends string,
		OptionsSchema extends AnyOptionalSchema | undefined = undefined,
	>(
		language: Language,
		rule: RuleDefinition<
			ExactObject<RuleDefinitionAbout, About>,
			GetLanguageAstNodesByName<Language>,
			GetLanguageFileServices<Language>,
			MessageId,
			OptionsSchema
		>,
	): Rule<
		RuleDefinitionAbout & { readonly pluginId: string; readonly url: string },
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
