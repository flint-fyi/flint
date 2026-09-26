import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) =>
		`https://flint.fyi/rules/changesets/${ruleId.toLowerCase()}`,
	pluginId: "changesets",
	presets: ["logical", "stylistic"],
});
