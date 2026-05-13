import rule from "./missingPlaceholders.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { messageId: string; data?: Record<string, string> }): void; };
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
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { messageId: string; data?: Record<string, string> }): void; };
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
			         ~~~~~~~~~~~~
			         Message template requires placeholders in the data object.
		});
	}
});
`,
		},
	],
	valid: [
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { messageId: string; data?: Record<string, string> }): void; };
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
