import type { ExactObject } from "../types/exact.ts";
import type { Language } from "../types/languages.ts";
import type {
	PluginRuleAbout,
	Rule,
	RuleCreatorAbout,
	RuleDefinition,
} from "../types/rules.ts";
import type { AnyOptionalSchema } from "../types/shapes.ts";

export interface RuleCreatorOptions<Preset extends string> {
	docs: (ruleId: string) => string;
	pluginId: string;
	presets: readonly Preset[];
}

export class RuleCreator<
	Preset extends string,
	const About extends RuleCreatorAbout = RuleCreatorAbout<Preset>,
> {
	#options: RuleCreatorOptions<Preset>;

	constructor(options: RuleCreatorOptions<Preset>) {
		this.#options = options;
	}

	createRule<
		const RuleDefinitionAbout extends About,
		AstNodesByName,
		FileServices extends object,
		const MessageId extends string,
		OptionsSchema extends AnyOptionalSchema | undefined = undefined,
	>(
		language: Language<AstNodesByName, FileServices>,
		rule: RuleDefinition<
			ExactObject<RuleDefinitionAbout, About>,
			NoInfer<AstNodesByName>,
			NoInfer<FileServices>,
			MessageId,
			OptionsSchema
		>,
	): Rule<PluginRuleAbout & RuleDefinitionAbout, MessageId, OptionsSchema> {
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
