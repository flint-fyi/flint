import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/json/${ruleId.toLowerCase()}`,
	pluginId: "json",
	presets: ["logical", "logicalStrict"],
});
