// flint-disable-file ts/escapeSequenceCasing
import rule from "./regexControlCharacters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\x1f/;
`,
			snapshot: String.raw`
/\x1f/;
 ~~~~
 Unexpected control character '\x1f' (U+001F) in regular expression.
`,
		},
		{
			code: String.raw`
/\x00/;
`,
			snapshot: String.raw`
/\x00/;
 ~~~~
 Unexpected control character '\x00' (U+0000) in regular expression.
`,
		},
		{
			code: String.raw`
/\x0a/;
`,
			snapshot: String.raw`
/\x0a/;
 ~~~~
 Unexpected control character '\x0a' (U+000A) in regular expression.
`,
		},
		{
			code: String.raw`
/\u001f/;
`,
			snapshot: String.raw`
/\u001f/;
 ~~~~~~
 Unexpected control character '\u001f' (U+001F) in regular expression.
`,
		},
		{
			code: String.raw`
/\u{1f}/;
`,
			snapshot: String.raw`
/\u{1f}/;
 ~~~~~~
 Unexpected control character '\u{1f}' (U+001F) in regular expression.
`,
		},
		{
			code: String.raw`
/\cA/;
`,
			snapshot: String.raw`
/\cA/;
 ~~~
 Unexpected control character '\cA' (U+0001) in regular expression.
`,
		},
		{
			code: String.raw`
new RegExp("\\x1f");
`,
			snapshot: String.raw`
new RegExp("\\x1f");
            ~~~~~
            Unexpected control character '\\x1f' (U+001F) in regular expression.
`,
		},
		{
			code: String.raw`
RegExp("\\u001f");
`,
			snapshot: String.raw`
RegExp("\\u001f");
        ~~~~~~~
        Unexpected control character '\\u001f' (U+001F) in regular expression.
`,
		},
	],
	valid: [
		`/foo/;`,
		String.raw`/\n/;`,
		String.raw`/\t/;`,
		String.raw`/\r/;`,
		String.raw`/\x20/;`,
		String.raw`/\x7f/;`,
		String.raw`/\u0020/;`,
		`new RegExp("foo");`,
		String.raw`new RegExp("\\n");`,
		`new RegExp(variable);`,
	],
});
