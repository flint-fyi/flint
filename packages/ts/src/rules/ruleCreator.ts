import { RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/ts/${ruleId}`,
	pluginId: "ts",
	presets: [
		"logical",
		"logicalStrict",
		"stylistic",
		"stylisticStrict",
		"untyped",
	],
});
