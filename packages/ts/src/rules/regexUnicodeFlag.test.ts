import rule from "./regexUnicodeFlag.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/abc/;
`,
			output: String.raw`
/abc/u;
`,
			snapshot: String.raw`
/abc/;
~~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
/abc/g;
`,
			output: String.raw`
/abc/gu;
`,
			snapshot: String.raw`
/abc/g;
~~~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
/abc/gim;
`,
			output: String.raw`
/abc/gimu;
`,
			snapshot: String.raw`
/abc/gim;
~~~~~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
RegExp("abc");
`,
			output: String.raw`
RegExp("abc", "u");
`,
			snapshot: String.raw`
RegExp("abc");
~~~~~~~~~~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
new RegExp("abc");
`,
			output: String.raw`
new RegExp("abc", "u");
`,
			snapshot: String.raw`
new RegExp("abc");
~~~~~~~~~~~~~~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
RegExp("abc", "g");
`,
			output: String.raw`
RegExp("abc", "gu");
`,
			snapshot: String.raw`
RegExp("abc", "g");
~~~~~~~~~~~~~~~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
/\a/;
`,
			snapshot: String.raw`
/\a/;
~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
		{
			code: String.raw`
RegExp("abc", flags);
`,
			snapshot: String.raw`
RegExp("abc", flags);
~~~~~~~~~~~~~~~~~~~~
Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.
`,
		},
	],
	valid: [
		String.raw`/abc/u;`,
		String.raw`/abc/gu;`,
		String.raw`/abc/v;`,
		String.raw`RegExp("abc", "u");`,
		String.raw`RegExp(variable);`,
		String.raw`RegExp(...args);`,
	],
});
