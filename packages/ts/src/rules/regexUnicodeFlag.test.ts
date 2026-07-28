import rule from "./regexUnicodeFlag.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/abc/;
`,
			output: `
/abc/u;
`,
			snapshot: `
/abc/;
~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
		{
			code: `
/abc/g;
`,
			output: `
/abc/gu;
`,
			snapshot: `
/abc/g;
~~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
		{
			code: `
/abc/gim;
`,
			output: `
/abc/gimu;
`,
			snapshot: `
/abc/gim;
~~~~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
		{
			code: `
RegExp("abc");
`,
			output: `
RegExp("abc", "u");
`,
			snapshot: `
RegExp("abc");
~~~~~~~~~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
		{
			code: `
new RegExp("abc");
`,
			output: `
new RegExp("abc", "u");
`,
			snapshot: `
new RegExp("abc");
~~~~~~~~~~~~~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
		{
			code: `
RegExp("abc", "g");
`,
			output: `
RegExp("abc", "gu");
`,
			snapshot: `
RegExp("abc", "g");
~~~~~~~~~~~~~~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
/\a/;
`,
			snapshot: String.raw`
/\a/;
~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
		{
			code: `
RegExp("abc", flags);
`,
			snapshot: `
RegExp("abc", flags);
~~~~~~~~~~~~~~~~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
`,
		},
	],
	valid: [
		"/abc/u;",
		"/abc/gu;",
		"/abc/v;",
		'RegExp("abc", "u");',
		"RegExp(variable);",
		"RegExp(...args);",
	],
});
