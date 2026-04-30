import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/md/${ruleId.toLowerCase()}`,
	pluginId: "md",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
