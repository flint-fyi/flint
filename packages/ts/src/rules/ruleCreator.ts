import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<
	RuleAbout<
		"javascript" | "logical" | "logicalStrict" | "stylistic" | "stylisticStrict"
	>
>({
	docs: (ruleId) => `https://flint.fyi/rules/ts/${ruleId.toLowerCase()}`,
	pluginId: "ts",
});
