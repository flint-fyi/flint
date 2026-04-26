import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/astro/${ruleId.toLowerCase()}`,
	pluginId: "astro",
	presets: ["logical", "stylistic", "security"],
});
