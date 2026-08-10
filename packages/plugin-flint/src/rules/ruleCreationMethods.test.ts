import rule from "./ruleCreationMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";

export default typescriptLanguage.createRule({
	about: {
		description: "Test rule",
		id: "testRule",
		presets: ["logical"],
	},
	messages: {},
	setup(context) {
		return { visitors: {} };
	},
});
`,
			snapshot: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";

export default typescriptLanguage.createRule({
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Plugin rules should be created through RuleCreator instead of calling language.createRule() directly.
	about: {
		description: "Test rule",
		id: "testRule",
		presets: ["logical"],
	},
	messages: {},
	setup(context) {
		return { visitors: {} };
	},
});
`,
		},
	],
	valid: [
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
		presets: ["logical"],
	},
	messages: {},
	setup(context) {
		return { visitors: {} };
	},
});
`,
	],
});
