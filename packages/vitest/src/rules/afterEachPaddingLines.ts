import { createBlockPaddingRule } from "../createBlockPaddingRule.ts";

export default createBlockPaddingRule(
	{
		description: "Enforces padding around `afterEach` blocks.",
		id: "afterEachPaddingLines",
		presets: [],
	},
	"afterEach",
);
