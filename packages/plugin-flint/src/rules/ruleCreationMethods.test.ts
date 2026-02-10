import rule from "./ruleCreationMethods.ts";
import { ruleTester } from "./ruleTester.ts";

const DefineRuleCreator = `interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; }`;

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
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
${DefineRuleCreator}
declare const ruleCreator: RuleCreator;

export default ruleCreator.createRule(_, {
	messages: {},
	setup(context) {
		return { visitors: {} };
	}
});
`,
		`
${DefineRuleCreator}
declare const ruleCreator: RuleCreator;

export default ruleCreator.createRule(_, {
	messages: {},
	setup(context) {
		return { visitors: {} };
	}
});
`,
	],
});
