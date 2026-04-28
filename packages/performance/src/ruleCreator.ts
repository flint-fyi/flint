import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<
	RuleAbout<"logical" | "stylistic" | "stylisticStrict">
>({
	docs: (ruleId) =>
		`https://flint.fyi/rules/performance/${ruleId.toLowerCase()}`,
	pluginId: "performance",
});
