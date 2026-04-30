import type { FilesValue } from "./files.ts";
import type { AnyRule, Rule, RuleAbout } from "./rules.ts";
import type { AnyOptionalSchema, InferredInputObject } from "./shapes.ts";

/**
 * A Flint plugin containing a set of rules and presets.
 * @see {@link https://flint.fyi/glossary#plugin|flint.fyi/glossary#plugin}
 */
export interface Plugin<
	About extends RuleAbout,
	FilesKey extends string | undefined,
	Rules extends AnyRule<About>[],
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
	presets: PluginPresets<
		About,
		NonNullable<Rules[number]["about"]["presets"]>[number]
	>;

	/**
	 * Defines rules to configure or disable on files in a config.
	 */
	rules: PluginRulesFactory<Rules>;

	/**
	 * A map of rule IDs to the rule definitions.
	 */
	rulesById: Map<string, Rules[number]>;
}

export type PluginPresets<
	About extends RuleAbout,
	Presets extends string | undefined,
> = Record<
	Presets extends string ? Presets : never,
	Rule<About, object, object, string, AnyOptionalSchema | undefined>[]
>;

/**
 * Defines rules to configure or disable on files in a config.
 * @param ruleOptions Pairs rule IDs with options, or `false` to disable them.
 */
export type PluginRulesFactory<Rules extends AnyRule[]> = (
	rulesOptions: PluginRulesOptions<Rules>,
) => Rules;

export type PluginRulesOptions<Rules extends AnyRule[]> = {
	[Rule in Rules[number] as Rule["about"]["id"]]?: Rule["options"] extends undefined
		? boolean
		: boolean | InferredInputObject<Rule["options"]>;
};
