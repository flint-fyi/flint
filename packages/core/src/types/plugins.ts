import type { ConfigRuleDefinitionObject } from "./configs.ts";
import type { FilesValue } from "./files.ts";
import type { RuleAbout, RuleBase } from "./rules.ts";
import type { InferredInputObject } from "./shapes.ts";

/**
 * A Flint plugin containing a set of rules and presets.
 * @see {@link https://flint.fyi/glossary#plugin|flint.fyi/glossary#plugin}
 */
export interface Plugin<
	About extends RuleAbout,
	FilesKey extends string | undefined,
	Rules extends RuleBase<About>[],
> {
	/**
	 * Selectors of files this plugin suggests applying its rules to.
	 * @see {@link https://flint.fyi/glossary#files|flint.fyi/glossary#files}
	 */
	files: undefined extends FilesKey
		? undefined
		: Record<FilesKey & string, FilesValue>;

	/**
	 * The friendly name of the plugin, such as "JSON" or "Typescript".
	 */
	name: string;

	/**
	 * Preset lists of rules to enable on files.
	 * @see {@link https://flint.fyi/glossary#preset|flint.fyi/glossary#preset}
	 */
	presets: PluginPresets<Rules>;

	/**
	 * Defines rules to configure or disable on files in a config.
	 */
	rules: PluginRulesFactory<Rules>;

	/**
	 * A map of rule IDs to the rule definitions.
	 */
	rulesById: PluginRulesById<Rules>;
}

export type PluginConfiguredRule<Rule extends RuleBase> =
	ConfigRuleDefinitionObject & {
		options: Rule["options"] extends undefined
			? boolean
			: boolean | InferredInputObject<Rule["options"]>;
		rule: Rule;
	};

export type PluginConfiguredRules<Rules extends RuleBase[]> = {
	[Rule in Rules[number] as Rule["about"]["id"]]: PluginConfiguredRule<Rule>;
}[Rules[number]["about"]["id"]][];

export type PluginPresetName<Rules extends RuleBase[]> =
	Rules[number] extends infer R
		? R extends { about: { presets: readonly (infer P extends string)[] } }
			? P
			: never
		: never;

export type PluginPresets<Rules extends RuleBase[]> = Record<
	PluginPresetName<Rules>,
	Rules[number][]
>;

export type PluginRulesById<Rules extends RuleBase[]> = {
	[Rule in Rules[number] as Rule["about"]["id"]]: Rule;
};

/**
 * Defines rules to configure or disable on files in a config.
 * @param ruleOptions Pairs rule IDs with options, or `false` to disable them.
 */
export type PluginRulesFactory<Rules extends RuleBase[]> = (
	rulesOptions: PluginRulesOptions<Rules>,
) => PluginConfiguredRules<Rules>;

export type PluginRulesOptions<Rules extends RuleBase[]> = {
	[Rule in Rules[number] as Rule["about"]["id"]]?: Rule["options"] extends undefined
		? boolean
		: boolean | InferredInputObject<Rule["options"]>;
};
