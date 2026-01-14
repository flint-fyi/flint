import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/flint/${ruleId.toLowerCase()}`,
	pluginId: "flint",
	presets: ["logical", "logicalStrict", "stylistic"],
});
