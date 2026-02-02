import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/md/${ruleId}`,
	pluginId: "md",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
