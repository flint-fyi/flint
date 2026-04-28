import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<
	RuleAbout<"logical" | "logicalStrict">
>({
	docs: (ruleId) => `https://flint.fyi/rules/json/${ruleId.toLowerCase()}`,
	pluginId: "json",
});
