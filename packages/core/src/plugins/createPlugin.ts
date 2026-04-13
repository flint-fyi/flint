import { CachedFactory } from "cached-factory";

import type { FilesValues } from "../types/files.ts";
import type {
	Plugin,
	PluginConfiguredRules,
	PluginPresets,
	PluginRulesById,
	PluginRulesOptions,
} from "../types/plugins.ts";
import type { AnyRule, RuleAbout } from "../types/rules.ts";

export type CreatePluginOptions<
	About extends RuleAbout,
	FilesKey extends string | undefined,
	Rules extends AnyRule<About>[],
> = FilesKey extends undefined
	? CreatePluginOptionsWithoutFiles<About, Rules>
	: CreatePluginOptionsWithFiles<About, FilesKey & string, Rules>;

export interface CreatePluginOptionsWithFiles<
	About extends RuleAbout,
	FilesKey extends string,
	Rules extends AnyRule<About>[],
> {
	files: Record<FilesKey, FilesValues>;
	name: string;
	rules: Rules;
}

export interface CreatePluginOptionsWithoutFiles<
	About extends RuleAbout,
	Rules extends AnyRule<About>[],
> {
	files?: never;
	name: string;
	rules: Rules;
}

export function createPlugin<
	const About extends RuleAbout,
	const FilesKey extends string | undefined,
	const Rules extends AnyRule<About>[],
>({
	files,
	name,
	rules,
}: CreatePluginOptions<About, FilesKey, Rules>): Plugin<
	About,
	FilesKey,
	Rules
> {
	const presets = collectPresetsFromRules(rules);
	const rulesById = Object.fromEntries(
		rules.map((rule) => [rule.about.id, rule]),
	) as PluginRulesById<Rules>;

	return {
		files: files as Plugin<About, FilesKey, Rules>["files"],
		name,
		presets,
		rules: (configuration) => {
			return Object.entries(configuration).map(([id, options]) =>
				createConfiguredRule(
					rulesById,
					id as keyof PluginRulesOptions<Rules> & string,
					options as PluginRulesOptions<Rules>[keyof PluginRulesOptions<Rules> &
						string],
				),
			) as PluginConfiguredRules<Rules>;
		},
		rulesById,
	};
}

function collectPresetsFromRules<
	const About extends RuleAbout,
	const Rules extends AnyRule<About>[],
>(rules: Rules) {
	const presets = new CachedFactory<string, Rules[number][]>(() => []);

	for (const rule of rules) {
		if (rule.about.presets) {
			for (const preset of rule.about.presets) {
				presets.get(preset).push(rule);
			}
		}
	}

	return Object.fromEntries(presets.entries()) as PluginPresets<Rules>;
}

function createConfiguredRule<
	const Rules extends AnyRule[],
	const RuleId extends keyof PluginRulesOptions<Rules> & string,
>(
	rulesById: PluginRulesById<Rules>,
	id: RuleId,
	options: PluginRulesOptions<Rules>[RuleId],
) {
	return {
		options,
		rule: rulesById[id],
	};
}
