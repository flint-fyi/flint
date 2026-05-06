import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/vitest/${ruleId.toLowerCase()}`,
	pluginId: "vitest",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
