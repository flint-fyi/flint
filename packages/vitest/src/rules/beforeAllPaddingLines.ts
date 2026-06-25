import { createBlockPaddingRule } from "../createBlockPaddingRule.ts";

export default createBlockPaddingRule(
	{
		description: "Enforces padding around `beforeAll` blocks.",
		id: "beforeAllPaddingLines",
		presets: [],
	},
	"beforeAll",
);
