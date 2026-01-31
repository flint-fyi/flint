import rule from "./regexUnnecessaryNestedAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?=^)/;
`,
			output: `
/^/;
`,
			snapshot: `
/(?=^)/;
 ~~~~~
 The lookaround '(?=^)' trivially wraps the assertion '^' and can be simplified.
`,
		},
		{
			code: `
/(?=$)/;
`,
			output: `
/$/;
`,
			snapshot: `
/(?=$)/;
 ~~~~~
 The lookaround '(?=$)' trivially wraps the assertion '$' and can be simplified.
`,
		},
		{
			code: String.raw`
/(?=\b)/;
`,
			output: String.raw`
/\b/;
`,
			snapshot: String.raw`
/(?=\b)/;
 ~~~~~~
 The lookaround '(?=\b)' trivially wraps the assertion '\b' and can be simplified.
`,
		},
		{
			code: String.raw`
/(?!\B)/;
`,
			output: String.raw`
/\B/;
`,
			snapshot: String.raw`
/(?!\B)/;
 ~~~~~~
 The lookaround '(?!\B)' trivially wraps the assertion '\B' and can be simplified.
`,
		},
		{
			code: `
/(?<=^)/;
`,
			output: `
/^/;
`,
			snapshot: `
/(?<=^)/;
 ~~~~~~
 The lookaround '(?<=^)' trivially wraps the assertion '^' and can be simplified.
`,
		},
		{
			code: `
/(?<!$)/;
`,
			output: `
/$/;
`,
			snapshot: `
/(?<!$)/;
 ~~~~~~
 The lookaround '(?<!$)' trivially wraps the assertion '$' and can be simplified.
`,
		},
		{
			code: `
/(?=(?=a))/;
`,
			output: `
/(?=a)/;
`,
			snapshot: `
/(?=(?=a))/;
 ~~~~~~~~~
 The lookaround '(?=(?=a))' trivially wraps the assertion '(?=a)' and can be simplified.
`,
		},
		{
			code: `
/(?=(?!b))/;
`,
			output: `
/(?!b)/;
`,
			snapshot: `
/(?=(?!b))/;
 ~~~~~~~~~
 The lookaround '(?=(?!b))' trivially wraps the assertion '(?!b)' and can be simplified.
`,
		},
		{
			code: `
/(?<=(?<=c))/;
`,
			output: `
/(?<=c)/;
`,
			snapshot: `
/(?<=(?<=c))/;
 ~~~~~~~~~~~
 The lookaround '(?<=(?<=c))' trivially wraps the assertion '(?<=c)' and can be simplified.
`,
		},
		{
			code: `
/(?<!(?<!d))/;
`,
			output: `
/(?<!d)/;
`,
			snapshot: `
/(?<!(?<!d))/;
 ~~~~~~~~~~~
 The lookaround '(?<!(?<!d))' trivially wraps the assertion '(?<!d)' and can be simplified.
`,
		},
		{
			code: `
new RegExp("(?=^)");
`,
			output: `
new RegExp("^");
`,
			snapshot: `
new RegExp("(?=^)");
            ~~~~~
            The lookaround '(?=^)' trivially wraps the assertion '^' and can be simplified.
`,
		},
		{
			code: String.raw`
new RegExp("(?=\\b)");
`,
			output: String.raw`
new RegExp("\\b");
`,
			snapshot: String.raw`
new RegExp("(?=\\b)");
            ~~~~~~~
            The lookaround '(?=\\b)' trivially wraps the assertion '\\b' and can be simplified.
`,
		},
		{
			code: `
RegExp("(?=$)");
`,
			output: `
RegExp("$");
`,
			snapshot: `
RegExp("(?=$)");
        ~~~~~
        The lookaround '(?=$)' trivially wraps the assertion '$' and can be simplified.
`,
		},
		{
			code: `
/(?=(?=foo))/;
`,
			output: `
/(?=foo)/;
`,
			snapshot: `
/(?=(?=foo))/;
 ~~~~~~~~~~~
 The lookaround '(?=(?=foo))' trivially wraps the assertion '(?=foo)' and can be simplified.
`,
		},
	],
	valid: [
		`/(?=a)/;`,
		`/(?!b)/;`,
		`/(?<=c)/;`,
		`/(?<!d)/;`,
		`/(?=^|$)/;`,
		`/(?=a|b)/;`,
		`/(?=(?<=a))/;`,
		`/(?<=(?=a))/;`,
		`/(?=^)+/;`,
		`/(?=$)*/;`,
		`/(?=^)?/;`,
		`/(?=$){2}/;`,
		`new RegExp(variable);`,
		`/^/;`,
		`/$/;`,
		String.raw`/\b/;`,
	],
});
