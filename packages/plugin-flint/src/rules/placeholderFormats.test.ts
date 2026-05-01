import rule from "./placeholderFormats.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing space {{placeholder}}",
		}
	},
});
`,
			output: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing space {{ placeholder }}",
		}
	},
});
`,
			snapshot: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing space {{placeholder}}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
		}
	},
});
`,
		},
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing trailing space {{ placeholder}}",
		}
	},
});
`,
			output: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing trailing space {{ placeholder }}",
		}
	},
});
`,
			snapshot: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing trailing space {{ placeholder}}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
		}
	},
});
`,
		},
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing leading space {{placeholder }}",
		}
	},
});
`,
			output: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing leading space {{ placeholder }}",
		}
	},
});
`,
			snapshot: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Missing leading space {{placeholder }}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
		}
	},
});
`,
		},
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			secondary: ["Array with {{badFormat}}"],
		}
	},
});
`,
			output: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			secondary: ["Array with {{ badFormat }}"],
		}
	},
});
`,
			snapshot: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			secondary: ["Array with {{badFormat}}"],
			            ~~~~~~~~~~~~~~~~~~~~~~~~~~
			            Placeholders should be formatted with single spaces inside the braces.
		}
	},
});
`,
		},
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Too many spaces {{  placeholder  }}",
		}
	},
});
`,
			output: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Too many spaces {{ placeholder }}",
		}
	},
});
`,
			snapshot: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Too many spaces {{  placeholder  }}",
			         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			         Placeholders should be formatted with single spaces inside the braces.
		}
	},
});
`,
		},
	],
	valid: [
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Properly formatted {{ placeholder }}",
		}
	},
});
`,
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "Multiple {{ placeholder1 }} and {{ placeholder2 }}",
		}
	},
});
`,
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
	messages: {
		messageId: {
			primary: "No placeholders here",
		}
	},
});
`,
	],
});
