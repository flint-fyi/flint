import { type RuleAbout, RuleCreator } from "@flint.fyi/core";

export const ruleCreator = new RuleCreator<RuleAbout<"logical">>({
	docs: (ruleId) => `https://flint.fyi/rules/spelling/${ruleId.toLowerCase()}`,
	pluginId: "spelling",
});
