import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<
	RuleAbout<"logical" | "logicalStrict" | "stylistic">
>({
	docs: (ruleId) => `https://flint.fyi/rules/jsx/${ruleId.toLowerCase()}`,
	pluginId: "jsx",
});
