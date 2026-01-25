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
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
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
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
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
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
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
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
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
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
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
			code: String.raw`
RegExp("abc", flags);
`,
			snapshot: String.raw`
RegExp("abc", flags);
~~~~~~~~~~~~~~~~~~~~
This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.
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
