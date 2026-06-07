import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/css/${ruleId.toLowerCase()}`,
	pluginId: "css",
	presets: ["logical"],
});
