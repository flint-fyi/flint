import { createBlockPaddingRule } from "../createBlockPaddingRule.ts";

export default createBlockPaddingRule(
	{
		description: "Enforces padding around `expect` groups.",
		id: "expectGroupPaddingLines",
		presets: [],
	},
	["expect", "expectTypeOf"],
	{ ignoreConsecutiveTargetNames: true },
);
