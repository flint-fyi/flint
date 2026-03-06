import rule from "./placeholderFormats.ts";
import { ruleTester } from "./ruleTester.ts";

const DefineRuleCreator = `interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; }`;

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
${DefineRuleCreator}
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
