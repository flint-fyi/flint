import { RuleCreator, type RuleCreatorAbout } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/vitest/${ruleId.toLowerCase()}`,
	pluginId: "vitest",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});

export type VitestPreset =
	| "logical"
	| "logicalStrict"
	| "stylistic"
	| "stylisticStrict";

export interface VitestRuleAbout extends RuleCreatorAbout<VitestPreset> {
	presets: VitestPreset[];
}
