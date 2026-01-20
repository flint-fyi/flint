import rule from "./missingPlaceholders.ts";
import { ruleTester } from "./ruleTester.ts";

const DefineRuleCreator = `interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; }`;
const DefineRuleContext = `interface RuleContext { report(descriptor: { messageId: string; data?: Record<string, string> }): void; }`;

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
${DefineRuleCreator}
${DefineRuleContext}
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messagesId: {
			primary: "This is a message with a {{placeholder1}}",
			secondary: [
				"This message also has a {{placeholder2}}",
			],
			suggestions: [""]
		}
	},
	setup(context: RuleContext) {
		context.report({
			message: "messagesId",
		});
	}
});
`,
			snapshot: `
${DefineRuleCreator}
${DefineRuleContext}
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messagesId: {
			primary: "This is a message with a {{placeholder1}}",
			secondary: [
				"This message also has a {{placeholder2}}",
			],
			suggestions: [""]
		}
	},
	setup(context: RuleContext) {
		context.report({
			message: "messagesId",
			~~~~~~~~~~~~~~~~~~~~~
			Message template requires placeholders in the data object.
		});
	}
});
`,
		},
	],
	valid: [
		`
${DefineRuleCreator}
${DefineRuleContext}
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messagesId: {
			primary: "This is a message with a {{placeholder1}}",
			secondary: [
				"This message also has a {{placeholder2}}",
			],
			suggestions: [""]
		}
	},
	setup(context: RuleContext) {
		context.report({
			data: {
				placeholder1: "value1",
				placeholder2: "value2",
			},
			message: "messagesId",
		});
	}
});
`,
	],
});
