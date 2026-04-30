import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/yaml/${ruleId.toLowerCase()}`,
	pluginId: "yaml",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
