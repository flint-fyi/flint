import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/browser/${ruleId.toLowerCase()}`,
	pluginId: "browser",
	presets: ["logical", "logicalStrict", "stylistic", "stylisticStrict"],
});
