import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<
	RuleAbout<"logical" | "security" | "stylistic">
>({
	docs: (ruleId) => `https://flint.fyi/rules/astro/${ruleId.toLowerCase()}`,
	pluginId: "astro",
});
