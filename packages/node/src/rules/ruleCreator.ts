import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/node/${ruleId.toLowerCase()}`,
	pluginId: "node",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
