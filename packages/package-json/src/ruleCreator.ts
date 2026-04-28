import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<
	RuleAbout<"logical" | "sorting" | "stylistic">
>({
	docs: (ruleId) =>
		`https://flint.fyi/rules/package-json/${ruleId.toLowerCase()}`,
	pluginId: "json",
});
