import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/spelling/${ruleId}`,
	pluginId: "spelling",
	presets: ["logical"],
});
