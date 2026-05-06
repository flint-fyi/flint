import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/svelte/${ruleId.toLowerCase()}`,
	pluginId: "svelte",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
