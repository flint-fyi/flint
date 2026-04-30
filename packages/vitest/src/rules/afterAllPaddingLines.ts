import { createPaddingRule } from "../createPaddingRule.ts";

export default createPaddingRule(
	{
		description: "Enforces padding around `afterAll` blocks.",
		id: "afterAllPaddingLines",
		presets: ["stylisticStrict"],
	},
	"afterAll",
);
