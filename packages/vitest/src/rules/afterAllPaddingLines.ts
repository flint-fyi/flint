import { createBlockPaddingRule } from "../createBlockPaddingRule.ts";

export default createBlockPaddingRule(
	{
		description: "Enforces padding around `afterAll` blocks.",
		id: "afterAllPaddingLines",
		presets: [],
	},
	"afterAll",
);
