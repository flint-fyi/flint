import rule from "./regexUnnecessaryOptionalAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/(?:\b|(?=a))?/;
`,
			snapshot: String.raw`
/(?:\b|(?=a))?/;
    ~~
    Remove unnecessary assertion '\b' inside optional quantifier '(?:\b|(?=a))?'.
       ~~~~~
       Remove unnecessary assertion '(?=a)' inside optional quantifier '(?:\b|(?=a))?'.
`,
		},
		{
			code: String.raw`
/(?:\b|a)?/;
`,
			snapshot: String.raw`
/(?:\b|a)?/;
    ~~
    Remove unnecessary assertion '\b' inside optional quantifier '(?:\b|a)?'.
`,
		},
		{
			code: String.raw`
/(?:^|a)*/;
`,
			snapshot: String.raw`
/(?:^|a)*/;
    ~
    Remove unnecessary assertion '^' inside optional quantifier '(?:^|a)*'.
`,
		},
		{
			code: String.raw`
/(?:$)*/;
`,
			snapshot: String.raw`
/(?:$)*/;
    ~
    Remove unnecessary assertion '$' inside optional quantifier '(?:$)*'.
`,
		},
		{
			code: String.raw`
/((\b)+){0,}/;
`,
			snapshot: String.raw`
/((\b)+){0,}/;
   ~~
   Remove unnecessary assertion '\b' inside optional quantifier '((\b)+){0,}'.
`,
		},
		{
			code: String.raw`
/(?:(?=foo))?/;
`,
			snapshot: String.raw`
/(?:(?=foo))?/;
    ~~~~~~~
    Remove unnecessary assertion '(?=foo)' inside optional quantifier '(?:(?=foo))?'.
`,
		},
		{
			code: String.raw`
/(?:(?<=bar))?/;
`,
			snapshot: String.raw`
/(?:(?<=bar))?/;
    ~~~~~~~~
    Remove unnecessary assertion '(?<=bar)' inside optional quantifier '(?:(?<=bar))?'.
`,
		},
		{
			code: String.raw`
/(?:(?!x))?/;
`,
			snapshot: String.raw`
/(?:(?!x))?/;
    ~~~~~
    Remove unnecessary assertion '(?!x)' inside optional quantifier '(?:(?!x))?'.
`,
		},
		{
			code: String.raw`
/(?:(?<!y))?/;
`,
			snapshot: String.raw`
/(?:(?<!y))?/;
    ~~~~~~
    Remove unnecessary assertion '(?<!y)' inside optional quantifier '(?:(?<!y))?'.
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
