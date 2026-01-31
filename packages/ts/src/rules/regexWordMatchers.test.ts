import rule from "./regexWordMatchers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[0-9a-zA-Z_]/;
`,
			output: `
/\\w/;
`,
			snapshot: `
/[0-9a-zA-Z_]/;
 ~~~~~~~~~~~~
 Character class '[0-9a-zA-Z_]' can be replaced with '\\w'.
`,
		},
		{
			code: `
/[a-zA-Z0-9_]/;
`,
			output: `
/\\w/;
`,
			snapshot: `
/[a-zA-Z0-9_]/;
 ~~~~~~~~~~~~
 Character class '[a-zA-Z0-9_]' can be replaced with '\\w'.
`,
		},
		{
			code: `
/[A-Za-z0-9_]/;
`,
			output: `
/\\w/;
`,
			snapshot: `
/[A-Za-z0-9_]/;
 ~~~~~~~~~~~~
 Character class '[A-Za-z0-9_]' can be replaced with '\\w'.
`,
		},
		{
			code: `
/[_0-9a-zA-Z]/;
`,
			output: `
/\\w/;
`,
			snapshot: `
/[_0-9a-zA-Z]/;
 ~~~~~~~~~~~~
 Character class '[_0-9a-zA-Z]' can be replaced with '\\w'.
`,
		},
		{
			code: `
/[^0-9a-zA-Z_]/;
`,
			output: `
/\\W/;
`,
			snapshot: `
/[^0-9a-zA-Z_]/;
 ~~~~~~~~~~~~~
 Character class '[^0-9a-zA-Z_]' can be replaced with '\\W'.
`,
		},
		{
			code: `
/[0-9a-z_]/i;
`,
			output: `
/\\w/i;
`,
			snapshot: `
/[0-9a-z_]/i;
 ~~~~~~~~~
 Character class '[0-9a-z_]' can be replaced with '\\w'.
`,
		},
		{
			code: `
/[^0-9a-z_]/i;
`,
			output: `
/\\W/i;
`,
			snapshot: `
/[^0-9a-z_]/i;
 ~~~~~~~~~~
 Character class '[^0-9a-z_]' can be replaced with '\\W'.
`,
		},
		{
			code: `
/[\\da-zA-Z_]/;
`,
			output: `
/\\w/;
`,
			snapshot: `
/[\\da-zA-Z_]/;
 ~~~~~~~~~~~
 Character class '[\\da-zA-Z_]' can be replaced with '\\w'.
`,
		},
		{
			code: `
new RegExp("[0-9a-zA-Z_]");
`,
			output: `
new RegExp("\\\\w");
`,
			snapshot: `
new RegExp("[0-9a-zA-Z_]");
            ~~~~~~~~~~~~
            Character class '[0-9a-zA-Z_]' can be replaced with '\\w'.
`,
		},
		{
			code: `
new RegExp("[^0-9a-zA-Z_]");
`,
			output: `
new RegExp("\\\\W");
`,
			snapshot: `
new RegExp("[^0-9a-zA-Z_]");
            ~~~~~~~~~~~~~
            Character class '[^0-9a-zA-Z_]' can be replaced with '\\W'.
`,
		},
		{
			code: `
RegExp("[0-9a-zA-Z_]");
`,
			output: `
RegExp("\\\\w");
`,
			snapshot: `
RegExp("[0-9a-zA-Z_]");
        ~~~~~~~~~~~~
        Character class '[0-9a-zA-Z_]' can be replaced with '\\w'.
`,
		},
		{
			code: `
new RegExp("[0-9a-z_]", "i");
`,
			output: `
new RegExp("\\\\w", "i");
`,
			snapshot: `
new RegExp("[0-9a-z_]", "i");
            ~~~~~~~~~
            Character class '[0-9a-z_]' can be replaced with '\\w'.
`,
		},
	],
	valid: [
		`/[0-9_]/;`,
		`/[0-9a-z_]/;`,
		`/[0-9a-zA-Z_#]/;`,
		`/[0-9a-zA-Z]/;`,
		`/[a-zA-Z_]/;`,
		`/\\w/;`,
		`/\\W/;`,
		`/foo/;`,
		`new RegExp("\\\\w");`,
		`new RegExp("\\\\W");`,
		`new RegExp("foo");`,
		`new RegExp(variable);`,
	],
});
