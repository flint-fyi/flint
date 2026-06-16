import rule from "./missingPlaceholders.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messagesId: {
			primary: "This is a message with a {{placeholder1}}",
			secondary: [
				"This message also has a {{placeholder2}}",
			],
			suggestions: [],
		},
	},
	setup(context) {
		context.report({
			message: "messagesId",
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
			snapshot: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messagesId: {
			primary: "This is a message with a {{placeholder1}}",
			secondary: [
				"This message also has a {{placeholder2}}",
			],
			suggestions: [],
		},
	},
	setup(context) {
		context.report({
			message: "messagesId",
			         ~~~~~~~~~~~~
			         Message template requires placeholders in the data object.
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
		},
	],
	valid: [
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messagesId: {
			primary: "This is a message with a {{placeholder1}}",
			secondary: [
				"This message also has a {{placeholder2}}",
			],
			suggestions: [],
		},
	},
	setup(context) {
		context.report({
			data: {
				placeholder1: "value1",
				placeholder2: "value2",
			},
			message: "messagesId",
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
	],
});
