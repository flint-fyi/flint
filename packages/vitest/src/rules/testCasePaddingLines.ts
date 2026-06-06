import { createBlockPaddingRule } from "../createBlockPaddingRule.ts";

export default createBlockPaddingRule(
	{
		description: "Enforces padding around `test` blocks.",
		id: "testCasePaddingLines",
		presets: [],
	},
	["test", "it", "fit", "xit", "xtest"],
	{ blockName: "test" },
);
