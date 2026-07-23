import { CachedFactory } from "cached-factory";

import type { FilesValues } from "../types/files.ts";
import type {
	Plugin,
	PluginPresets,
	PluginRulesFactory,
} from "../types/plugins.ts";
import type { AnyRule, RuleAbout, UnsafeAnyRule } from "../types/rules.ts";

export type CreatePluginOptions<
	About extends RuleAbout,
	FilesKey extends string | undefined,
	Rules extends UnsafeAnyRule<About>[],
> = FilesKey extends undefined
	? CreatePluginOptionsWithoutFiles<About, Rules>
	: CreatePluginOptionsWithFiles<About, FilesKey & string, Rules>;

export interface CreatePluginOptionsWithFiles<
	About extends RuleAbout,
	FilesKey extends string,
	Rules extends UnsafeAnyRule<About>[],
> {
	files: Record<FilesKey, FilesValues>;
	name: string;
	rules: Rules;
}

export interface CreatePluginOptionsWithoutFiles<
	About extends RuleAbout,
	Rules extends UnsafeAnyRule<About>[],
> {
	files?: never;
	name: string;
	rules: Rules;
}

export function createPlugin<
	const About extends RuleAbout,
	const FilesKey extends string | undefined,
	const Rules extends UnsafeAnyRule<About>[],
>({
	files,
	name,
	rules,
}: CreatePluginOptions<About, FilesKey, Rules>): Plugin<
	About,
	FilesKey,
	Rules
> {
	const presets = collectPresetsFromRules<About, Rules>(rules);
	const rulesById = new Map(rules.map((rule) => [rule.about.id, rule]));

	return {
		// TODO: Figure this out...?
		files: files as Plugin<About, FilesKey, Rules>["files"],
		name,
		presets,
		rules: ((configuration) => {
			return Object.entries(configuration).map(([id, options]) => ({
				options,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				rule: rulesById.get(id)!,
			}));
		}) as PluginRulesFactory<Rules>,
		rulesById,
	};
}

function collectPresetsFromRules<
	const About extends RuleAbout,
	const Rules extends AnyRule<About>[],
>(rules: Rules): PluginPresets<Rules> {
	const presets = new CachedFactory<string, UnsafeAnyRule<About>[]>(() => []);

	for (const rule of rules) {
		if (rule.about.presets !== undefined) {
			for (const preset of rule.about.presets) {
				presets.get(preset).push(rule);
			}
		}
	}

	return Object.fromEntries(presets.entries());
}
