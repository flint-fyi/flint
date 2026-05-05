import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/vue/${ruleId.toLowerCase()}`,
	pluginId: "vue",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
