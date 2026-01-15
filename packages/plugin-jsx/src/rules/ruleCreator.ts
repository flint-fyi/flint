import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/jsx/${ruleId.toLowerCase()}`,
	pluginId: "jsx",
	presets: ["logical", "logicalStrict", "stylistic"],
});
