import { CachedFactory } from "cached-factory";

import type { FilesValues } from "../types/files.ts";
import type { Plugin, PluginPresets } from "../types/plugins.ts";
import type { Rule, RuleAbout } from "../types/rules.ts";

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

export type UnsafeAnyRule<About extends RuleAbout = RuleAbout> = Rule<
	About,
	// TODO: How to make these types work with createPlugin.test.ts & co.?
	// flint-disable-lines-begin explicitAnys
	/* eslint-disable @typescript-eslint/no-explicit-any */
	any,
	any,
	any,
	any
	/* eslint-enable @typescript-eslint/no-explicit-any */
	// flint-disable-lines-end explicitAnys
>;

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
	const presets = collectPresetsFromRules(rules);
	const rulesById = new Map(rules.map((rule) => [rule.about.id, rule]));

	return {
		// @ts-expect-error -- TODO: Figure this out...?
		files,
		name,
		presets,
		// @ts-expect-error -- TODO: Figure out what to assert...?
		rules: (configuration) => {
			return Object.entries(configuration).map(([id, options]) => ({
				options,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				rule: rulesById.get(id)!,
			}));
		},
		rulesById,
	};
}

function collectPresetsFromRules<const About extends RuleAbout>(
	rules: UnsafeAnyRule<About>[],
) {
	const presets = new CachedFactory<string, UnsafeAnyRule<About>[]>(() => []);

	for (const rule of rules) {
		if (rule.about.presets) {
			for (const preset of rule.about.presets) {
				presets.get(preset).push(rule);
			}
		}
	}

	return Object.fromEntries(presets.entries()) as PluginPresets<About, string>;
}
