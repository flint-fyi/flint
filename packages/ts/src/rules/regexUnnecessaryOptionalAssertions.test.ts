import rule from "./regexUnnecessaryOptionalAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/(?:\b|(?=a))?/;
`,
			output: String.raw`
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
			output: String.raw`
/(?:|a)?/;
`,
			snapshot: `
/(?:\\b|a)?/;
    ~~
    The assertion \`\\b\` inside optional quantifier \`(?:\\b|a)?\` is unnecessary.
`,
		},
		{
			code: String.raw`
/(?:^|a)*/;
`,
			output: String.raw`
/(?:|a)*/;
`,
			snapshot: `
/(?:^|a)*/;
    ~
    The assertion \`^\` inside optional quantifier \`(?:^|a)*\` is unnecessary.
`,
		},
		{
			code: String.raw`
/(?:$)*/;
`,
			output: String.raw`
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
			output: String.raw`
/(()+){0,}/;
`,
			snapshot: `
/((\\b)+){0,}/;
   ~~
   The assertion \`\\b\` inside optional quantifier \`((\\b)+){0,}\` is unnecessary.
`,
		},
		{
			code: String.raw`
/(?:(?=foo))?/;
`,
			output: String.raw`
/(?:)?/;
`,
			snapshot: `
/(?:(?=foo))?/;
    ~~~~~~~
    The assertion \`(?=foo)\` inside optional quantifier \`(?:(?=foo))?\` is unnecessary.
`,
		},
		{
			code: String.raw`
/(?:(?<=bar))?/;
`,
			output: String.raw`
/(?:)?/;
`,
			snapshot: `
/(?:(?<=bar))?/;
    ~~~~~~~~
    The assertion \`(?<=bar)\` inside optional quantifier \`(?:(?<=bar))?\` is unnecessary.
`,
		},
		{
			code: String.raw`
/(?:(?!x))?/;
`,
			output: String.raw`
/(?:)?/;
`,
			snapshot: `
/(?:(?!x))?/;
    ~~~~~
    The assertion \`(?!x)\` inside optional quantifier \`(?:(?!x))?\` is unnecessary.
`,
		},
		{
			code: String.raw`
/(?:(?<!y))?/;
`,
			output: String.raw`
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
		String.raw`/(?:^a)*/;`,
		String.raw`/(?:\b-)?/;`,
		String.raw`/\b/;`,
		String.raw`/^foo$/;`,
		String.raw`/(?=bar)/;`,
		String.raw`RegExp(variable);`,
		String.raw`/(?:ab)?/;`,
		String.raw`new RegExp("(?:\\b|a)?");`,
	],
});
