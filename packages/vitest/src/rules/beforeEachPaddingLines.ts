import { createBlockPaddingRule } from "../createBlockPaddingRule.ts";

export default createBlockPaddingRule(
	{
		description: "Enforces padding around `beforeEach` blocks.",
		id: "beforeEachPaddingLines",
		presets: [],
	},
	"beforeEach",
);
