import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<
	RuleAbout<"logical" | "logicalStrict" | "stylistic" | "stylisticStrict">
>({
	docs: (ruleId) => `https://flint.fyi/rules/yaml/${ruleId.toLowerCase()}`,
	pluginId: "yaml",
});
