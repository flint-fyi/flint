import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) =>
		`https://flint.fyi/rules/package-json/${ruleId.toLowerCase()}`,
	pluginId: "package-json",
	presets: ["logical", "sorting", "stylistic"],
});
