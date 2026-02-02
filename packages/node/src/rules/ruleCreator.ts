import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/node/${ruleId}`,
	pluginId: "node",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
