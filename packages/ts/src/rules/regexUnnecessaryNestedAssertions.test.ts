import rule from "./regexUnnecessaryNestedAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?=$)/;
`,
			snapshot: `
/(?=$)/;
 ~~~~~
 The lookaround '(?=$)' trivially wraps the assertion '$' and can be simplified.
`,
		},
		{
			code: `
/(?=^)/;
`,
			snapshot: `
/(?=^)/;
 ~~~~~
 The lookaround '(?=^)' trivially wraps the assertion '^' and can be simplified.
`,
		},
		{
			code: `
/(?=\\b)/;
`,
			snapshot: `
/(?=\\b)/;
 ~~~~~~
 The lookaround '(?=\\b)' trivially wraps the assertion '\\b' and can be simplified.
`,
		},
		{
			code: `
/(?=\\B)/;
`,
			snapshot: `
/(?=\\B)/;
 ~~~~~~
 The lookaround '(?=\\B)' trivially wraps the assertion '\\B' and can be simplified.
`,
		},
		{
			code: `
/(?!$)/;
`,
			snapshot: `
/(?!$)/;
 ~~~~~
 The lookaround '(?!$)' trivially wraps the assertion '$' and can be simplified.
`,
		},
		{
			code: `
/(?<=$)/;
`,
			snapshot: `
/(?<=$)/;
 ~~~~~~
 The lookaround '(?<=$)' trivially wraps the assertion '$' and can be simplified.
`,
		},
		{
			code: `
/(?<!^)/;
`,
			snapshot: `
/(?<!^)/;
 ~~~~~~
 The lookaround '(?<!^)' trivially wraps the assertion '^' and can be simplified.
`,
		},
		{
			code: `
/(?=(?=a))/;
`,
			snapshot: `
/(?=(?=a))/;
 ~~~~~~~~~
 The lookaround '(?=(?=a))' trivially wraps the assertion '(?=a)' and can be simplified.
`,
		},
		{
			code: `
/(?<=(?<=a))/;
`,
			snapshot: `
/(?<=(?<=a))/;
 ~~~~~~~~~~~
 The lookaround '(?<=(?<=a))' trivially wraps the assertion '(?<=a)' and can be simplified.
`,
		},
		{
			code: `
/(?!(?!a))/;
`,
			snapshot: `
/(?!(?!a))/;
 ~~~~~~~~~
 The lookaround '(?!(?!a))' trivially wraps the assertion '(?!a)' and can be simplified.
`,
		},
		{
			code: `
/(?<!(?<!a))/;
`,
			snapshot: `
/(?<!(?<!a))/;
 ~~~~~~~~~~~
 The lookaround '(?<!(?<!a))' trivially wraps the assertion '(?<!a)' and can be simplified.
`,
		},
		{
			code: `
/(?=(?!a))/;
`,
			snapshot: `
/(?=(?!a))/;
 ~~~~~~~~~
 The lookaround '(?=(?!a))' trivially wraps the assertion '(?!a)' and can be simplified.
`,
		},
		{
			code: `
new RegExp("(?=$)");
`,
			snapshot: `
new RegExp("(?=$)");
            ~~~~~
            The lookaround '(?=$)' trivially wraps the assertion '$' and can be simplified.
`,
		},
		{
			code: `
RegExp("(?=\\\\b)");
`,
			snapshot: `
RegExp("(?=\\\\b)");
        ~~~~~~~
        The lookaround '(?=\\\\b)' trivially wraps the assertion '\\\\b' and can be simplified.
`,
		},
	],
	valid: [
		`/(?=$a)/;`,
		`/(?=a$)/;`,
		`/(?=a|b)/;`,
		`/(?=(?<=a))/;`,
		`/(?<=(?=a))/;`,
		`/(?=abc)/;`,
		`/(?=a(?=b))/;`,
		`/a$/;`,
		`new RegExp(variable);`,
		`/(?=(?=a)+)/;`,
	],
});
