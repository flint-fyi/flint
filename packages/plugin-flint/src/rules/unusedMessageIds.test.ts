import { ruleTester } from "./ruleTester.ts";
import rule from "./unusedMessageIds.ts";

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
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
		unusedMessageId: {
			primary: "This message ID is never used.",
			secondary: [],
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
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
		unusedMessageId: {
		~~~~~~~~~~~~~~~
		Message ID 'unusedMessageId' is defined but never used.
			primary: "This message ID is never used.",
			secondary: [],
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
		},
		{
			code: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { reportSourceCode } from "@flint.fyi/volar-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		usedMessageId: {
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
		unusedMessageId: {
			primary: "This message ID is never used.",
			secondary: [],
			suggestions: [],
		},
	},
	setup(context) {
		reportSourceCode(context, {
			message: "usedMessageId",
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
			snapshot: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { reportSourceCode } from "@flint.fyi/volar-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		usedMessageId: {
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
		unusedMessageId: {
		~~~~~~~~~~~~~~~
		Message ID 'unusedMessageId' is defined but never used.
			primary: "This message ID is never used.",
			secondary: [],
			suggestions: [],
		},
	},
	setup(context) {
		reportSourceCode(context, {
			message: "usedMessageId",
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
			primary: "This message ID has been used.",
			secondary: [],
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
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { reportSourceCode } from "@flint.fyi/volar-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messagesId: {
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
	},
	setup(context) {
		reportSourceCode(context, {
			message: "messagesId",
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { reportSourceCode as reportFromSourceCode } from "@flint.fyi/volar-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messagesId: {
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
	},
	setup(context) {
		reportFromSourceCode(context, {
			message: "messagesId",
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as volarLanguage from "@flint.fyi/volar-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messagesId: {
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
	},
	setup(context) {
		volarLanguage.reportSourceCode(context, {
			message: "messagesId",
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { reportSourceCode } from "@flint.fyi/volar-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messagesId: {
			primary: "This message ID has been used.",
			secondary: [],
			suggestions: [],
		},
		unusedMessageId: {
			primary: "This message ID is never used.",
			secondary: [],
			suggestions: [],
		},
	},
	setup(context) {
		const message = "messagesId";

		reportSourceCode(context, {
			message,
			range: { begin: 0, end: 0 },
		});
		return undefined;
	},
});
`,
	],
});
