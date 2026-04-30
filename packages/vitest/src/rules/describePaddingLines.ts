import { createBlockPaddingRule } from "../createBlockPaddingRule.ts";

export default createBlockPaddingRule(
	{
		description: "Enforces padding around `describe` blocks.",
		id: "describePaddingLines",
		presets: ["stylisticStrict"],
	},
	["describe", "fdescribe", "xdescribe"],
);
