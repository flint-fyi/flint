import rule from "./regexWordMatchers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[0-9a-zA-Z_]/;
`,
			output: String.raw`
/\w/;
`,
			snapshot: String.raw`
/[0-9a-zA-Z_]/;
 ~~~~~~~~~~~~
 Character class '[0-9a-zA-Z_]' can be replaced with '\w'.
`,
		},
		{
			code: `
/[a-zA-Z0-9_]/;
`,
			output: String.raw`
/\w/;
`,
			snapshot: String.raw`
/[a-zA-Z0-9_]/;
 ~~~~~~~~~~~~
 Character class '[a-zA-Z0-9_]' can be replaced with '\w'.
`,
		},
		{
			code: `
/[A-Za-z0-9_]/;
`,
			output: String.raw`
/\w/;
`,
			snapshot: String.raw`
/[A-Za-z0-9_]/;
 ~~~~~~~~~~~~
 Character class '[A-Za-z0-9_]' can be replaced with '\w'.
`,
		},
		{
			code: `
/[_0-9a-zA-Z]/;
`,
			output: String.raw`
/\w/;
`,
			snapshot: String.raw`
/[_0-9a-zA-Z]/;
 ~~~~~~~~~~~~
 Character class '[_0-9a-zA-Z]' can be replaced with '\w'.
`,
		},
		{
			code: `
/[^0-9a-zA-Z_]/;
`,
			output: String.raw`
/\W/;
`,
			snapshot: String.raw`
/[^0-9a-zA-Z_]/;
 ~~~~~~~~~~~~~
 Character class '[^0-9a-zA-Z_]' can be replaced with '\W'.
`,
		},
		{
			code: `
/[0-9a-z_]/i;
`,
			output: String.raw`
/\w/i;
`,
			snapshot: String.raw`
/[0-9a-z_]/i;
 ~~~~~~~~~
 Character class '[0-9a-z_]' can be replaced with '\w'.
`,
		},
		{
			code: `
/[^0-9a-z_]/i;
`,
			output: String.raw`
/\W/i;
`,
			snapshot: String.raw`
/[^0-9a-z_]/i;
 ~~~~~~~~~~
 Character class '[^0-9a-z_]' can be replaced with '\W'.
`,
		},
		{
			code: String.raw`
/[\da-zA-Z_]/;
`,
			output: String.raw`
/\w/;
`,
			snapshot: String.raw`
/[\da-zA-Z_]/;
 ~~~~~~~~~~~
 Character class '[\da-zA-Z_]' can be replaced with '\w'.
`,
		},
		{
			code: `
new RegExp("[0-9a-zA-Z_]");
`,
			output: String.raw`
new RegExp("\\w");
`,
			snapshot: String.raw`
new RegExp("[0-9a-zA-Z_]");
            ~~~~~~~~~~~~
            Character class '[0-9a-zA-Z_]' can be replaced with '\w'.
`,
		},
		{
			code: `
new RegExp("[^0-9a-zA-Z_]");
`,
			output: String.raw`
new RegExp("\\W");
`,
			snapshot: String.raw`
new RegExp("[^0-9a-zA-Z_]");
            ~~~~~~~~~~~~~
            Character class '[^0-9a-zA-Z_]' can be replaced with '\W'.
`,
		},
		{
			code: `
RegExp("[0-9a-zA-Z_]");
`,
			output: String.raw`
RegExp("\\w");
`,
			snapshot: String.raw`
RegExp("[0-9a-zA-Z_]");
        ~~~~~~~~~~~~
        Character class '[0-9a-zA-Z_]' can be replaced with '\w'.
`,
		},
		{
			code: `
new RegExp("[0-9a-z_]", "i");
`,
			output: String.raw`
new RegExp("\\w", "i");
`,
			snapshot: String.raw`
new RegExp("[0-9a-z_]", "i");
            ~~~~~~~~~
            Character class '[0-9a-z_]' can be replaced with '\w'.
`,
		},
	],
	valid: [
		`/[0-9_]/;`,
		`/[0-9a-z_]/;`,
		`/[0-9a-zA-Z_#]/;`,
		`/[0-9a-zA-Z]/;`,
		`/[a-zA-Z_]/;`,
		String.raw`/\w/;`,
		String.raw`/\W/;`,
		`/foo/;`,
		String.raw`new RegExp("\\w");`,
		String.raw`new RegExp("\\W");`,
		`new RegExp("foo");`,
		`new RegExp(variable);`,
	],
});
