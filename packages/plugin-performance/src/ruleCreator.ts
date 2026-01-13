import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) =>
		`https://flint.fyi/rules/performance/${ruleId.toLowerCase()}`,
	pluginId: "performance",
	presets: ["logical", "stylistic", "stylisticStrict"],
});
