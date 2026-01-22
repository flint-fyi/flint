import rule from "./regexDigitMatchers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[0-9]/;
`,
			output: `
/\\d/;
`,
			snapshot: `
/[0-9]/;
 ~~~~~
 Prefer '\\d' over character class '[0-9]'.
`,
		},
		{
			code: `
/[^0-9]/;
`,
			output: `
/\\D/;
`,
			snapshot: `
/[^0-9]/;
 ~~~~~~
 Prefer '\\D' over character class '[^0-9]'.
`,
		},
		{
			code: `
/[0123456789]/;
`,
			output: `
/\\d/;
`,
			snapshot: `
/[0123456789]/;
 ~~~~~~~~~~~~
 Prefer '\\d' over character class '[0123456789]'.
`,
		},
		{
			code: `
/[^0123456789]/;
`,
			output: `
/\\D/;
`,
			snapshot: `
/[^0123456789]/;
 ~~~~~~~~~~~~~
 Prefer '\\D' over character class '[^0123456789]'.
`,
		},
		{
			code: `
/^[0-9]+$/;
`,
			output: `
/^\\d+$/;
`,
			snapshot: `
/^[0-9]+$/;
  ~~~~~
  Prefer '\\d' over character class '[0-9]'.
`,
		},
		{
			code: `
new RegExp("[0-9]");
`,
			output: `
new RegExp("\\\\d");
`,
			snapshot: `
new RegExp("[0-9]");
            ~~~~~
            Prefer '\\\\d' over character class '[0-9]'.
`,
		},
		{
			code: `
RegExp("[^0-9]");
`,
			output: `
RegExp("\\\\D");
`,
			snapshot: `
RegExp("[^0-9]");
        ~~~~~~
        Prefer '\\\\D' over character class '[^0-9]'.
`,
		},
	],
	valid: [
		`/\\d/;`,
		`/\\D/;`,
		`/[0-8]/;`,
		`/[1-9]/;`,
		`/[0-9a-z]/;`,
		`/[a-z0-9]/;`,
		`/foo/;`,
		`new RegExp("\\\\d");`,
		`new RegExp("\\\\D");`,
		`new RegExp("foo");`,
		`new RegExp(variable);`,
	],
});
