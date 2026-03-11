import { ruleTester } from "./ruleTester.ts";
import rule from "./unusedMessageIds.ts";

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
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
    unusedMessageId: {
      primary: "This message ID is never used.",
      secondary: [""],
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
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
    unusedMessageId: {
    ~~~~~~~~~~~~~~~
    Message ID 'unusedMessageId' is defined but never used.
      primary: "This message ID is never used.",
      secondary: [""],
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
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
  },
  setup(context: RuleContext) {
    context.report({
      message: "messagesId",
    });
  }
});
`,
	],
});
