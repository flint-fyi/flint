import rule from "./placeholderFormats.ts";
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
		messageId: {
			primary: "Missing space {{placeholder}}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
			output: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messageId: {
			primary: "Missing space {{ placeholder }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
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
		messageId: {
			primary: "Missing space {{placeholder}}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
		},
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
		messageId: {
			primary: "Missing trailing space {{ placeholder}}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
			output: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messageId: {
			primary: "Missing trailing space {{ placeholder }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
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
		messageId: {
			primary: "Missing trailing space {{ placeholder}}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
		},
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
		messageId: {
			primary: "Missing leading space {{placeholder }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
			output: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messageId: {
			primary: "Missing leading space {{ placeholder }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
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
		messageId: {
			primary: "Missing leading space {{placeholder }}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
		},
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
		messageId: {
			primary: "",
			secondary: ["Array with {{badFormat}}"],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
			output: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messageId: {
			primary: "",
			secondary: ["Array with {{ badFormat }}"],
			suggestions: [],
		},
	},
	setup() {
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
		messageId: {
			primary: "",
			secondary: ["Array with {{badFormat}}"],
			            ~~~~~~~~~~~~~~~~~~~~~~~~~~
			            Placeholders should be formatted with single spaces inside the braces.
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
		},
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
		messageId: {
			primary: "Too many spaces {{  placeholder  }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
			output: `
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messageId: {
			primary: "Too many spaces {{ placeholder }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
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
		messageId: {
			primary: "Too many spaces {{  placeholder  }}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
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
		messageId: {
			primary: "Properly formatted {{ placeholder }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messageId: {
			primary: "Multiple {{ placeholder1 }} and {{ placeholder2 }}",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
		`
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { ruleCreator } from "../ruleCreator";

ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Test rule",
		id: "testRule",
	},
	messages: {
		messageId: {
			primary: "No placeholders here",
			secondary: [],
			suggestions: [],
		},
	},
	setup() {
		return undefined;
	},
});
`,
	],
});
