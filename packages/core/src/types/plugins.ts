import type { FilesValue } from "./files.ts";
import type { AnyRule, Rule, RuleAbout } from "./rules.ts";
import type { AnyOptionalSchema, InferredInputObject } from "./shapes.ts";

export interface Plugin<
	About extends RuleAbout,
	FilesKey extends string | undefined,
	Rules extends AnyRule<About>[],
> {
	files: undefined extends FilesKey
		? undefined
		: Record<FilesKey & string, FilesValue>;
	name: string;
	presets: PluginPresets<
		About,
		NonNullable<Rules[number]["about"]["presets"]>[number]
	>;
	rules: PluginRulesFactory<Rules>;
	rulesById: Map<string, Rules[number]>;
}

export type PluginPresets<
	About extends RuleAbout,
	Presets extends string | undefined,
> = Record<
	Presets extends string ? Presets : never,
	Rule<About, object, object, string, AnyOptionalSchema | undefined>[]
>;

export type PluginRulesFactory<Rules extends AnyRule[]> = (
	rulesOptions: PluginRulesOptions<Rules>,
) => Rules;

export type PluginRulesOptions<Rules extends AnyRule[]> = {
	[Rule in Rules[number] as Rule["about"]["id"]]?: Rule["options"] extends undefined
		? boolean
		: boolean | InferredInputObject<Rule["options"]>;
};
