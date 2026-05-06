import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/ts/${ruleId.toLowerCase()}`,
	pluginId: "ts",
	presets: [
		"javascript",
		"logical",
		"logicalStrict",
		"stylistic",
		"stylisticStrict",
	],
});
