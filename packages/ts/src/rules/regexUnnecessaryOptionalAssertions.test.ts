import rule from "./regexUnnecessaryOptionalAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/(?:\b|(?=a))?/;
`,
			output: `
/(?:|)?/;
`,
			snapshot: `
/(?:\\b|(?=a))?/;
    ~~
    The assertion \`\\b\` inside optional quantifier \`(?:\\b|(?=a))?\` is unnecessary.
       ~~~~~
       The assertion \`(?=a)\` inside optional quantifier \`(?:\\b|(?=a))?\` is unnecessary.
`,
		},
		{
			code: String.raw`
/(?:\b|a)?/;
`,
			output: `
/(?:|a)?/;
`,
			snapshot: `
/(?:\\b|a)?/;
    ~~
    The assertion \`\\b\` inside optional quantifier \`(?:\\b|a)?\` is unnecessary.
`,
		},
		{
			code: `
/(?:^|a)*/;
`,
			output: `
/(?:|a)*/;
`,
			snapshot: `
/(?:^|a)*/;
    ~
    The assertion \`^\` inside optional quantifier \`(?:^|a)*\` is unnecessary.
`,
		},
		{
			code: `
/(?:$)*/;
`,
			output: `
/(?:)*/;
`,
			snapshot: `
/(?:$)*/;
    ~
    The assertion \`$\` inside optional quantifier \`(?:$)*\` is unnecessary.
`,
		},
		{
			code: String.raw`
/((\b)+){0,}/;
`,
			output: `
/(()+){0,}/;
`,
			snapshot: `
/((\\b)+){0,}/;
   ~~
   The assertion \`\\b\` inside optional quantifier \`((\\b)+){0,}\` is unnecessary.
`,
		},
		{
			code: `
/(?:(?=foo))?/;
`,
			output: `
/(?:)?/;
`,
			snapshot: `
/(?:(?=foo))?/;
    ~~~~~~~
    The assertion \`(?=foo)\` inside optional quantifier \`(?:(?=foo))?\` is unnecessary.
`,
		},
		{
			code: `
/(?:(?<=bar))?/;
`,
			output: `
/(?:)?/;
`,
			snapshot: `
/(?:(?<=bar))?/;
    ~~~~~~~~
    The assertion \`(?<=bar)\` inside optional quantifier \`(?:(?<=bar))?\` is unnecessary.
`,
		},
		{
			code: `
/(?:(?!x))?/;
`,
			output: `
/(?:)?/;
`,
			snapshot: `
/(?:(?!x))?/;
    ~~~~~
    The assertion \`(?!x)\` inside optional quantifier \`(?:(?!x))?\` is unnecessary.
`,
		},
		{
			code: `
/(?:(?<!y))?/;
`,
			output: `
/(?:)?/;
`,
			snapshot: `
/(?:(?<!y))?/;
    ~~~~~~
    The assertion \`(?<!y)\` inside optional quantifier \`(?:(?<!y))?\` is unnecessary.
`,
		},
	],
	valid: [
		String.raw`/fo(?:o\b)?/;`,
		String.raw`/fo(?:o\b)/;`,
		String.raw`/(?:a|(\b|-){2})?/;`,
		"/(?:^a)*/;",
		String.raw`/(?:\b-)?/;`,
		String.raw`/\b/;`,
		"/^foo$/;",
		"/(?=bar)/;",
		"RegExp(variable);",
		"/(?:ab)?/;",
		String.raw`new RegExp("(?:\\b|a)?");`,
	],
});
