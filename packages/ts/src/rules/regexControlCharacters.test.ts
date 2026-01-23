// flint-disable-file escapeSequenceCasing
import rule from "./regexControlCharacters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/\\x1f/;
`,
			snapshot: `
/\\x1f/;
 ~~~~
 Unexpected control character '\\x1f' (U+001F) in regular expression.
`,
		},
		{
			code: `
/\\x00/;
`,
			snapshot: `
/\\x00/;
 ~~~~
 Unexpected control character '\\x00' (U+0000) in regular expression.
`,
		},
		{
			code: `
/\\x0a/;
`,
			snapshot: `
/\\x0a/;
 ~~~~
 Unexpected control character '\\x0a' (U+000A) in regular expression.
`,
		},
		{
			code: `
/\\u001f/;
`,
			snapshot: `
/\\u001f/;
 ~~~~~~
 Unexpected control character '\\u001f' (U+001F) in regular expression.
`,
		},
		{
			code: `
/\\u{1f}/;
`,
			snapshot: `
/\\u{1f}/;
 ~~~~~~
 Unexpected control character '\\u{1f}' (U+001F) in regular expression.
`,
		},
		{
			code: `
/\\cA/;
`,
			snapshot: `
/\\cA/;
 ~~~
 Unexpected control character '\\cA' (U+0001) in regular expression.
`,
		},
		{
			code: `
new RegExp("\\\\x1f");
`,
			snapshot: `
new RegExp("\\\\x1f");
            ~~~~~
            Unexpected control character '\\\\x1f' (U+001F) in regular expression.
`,
		},
		{
			code: `
RegExp("\\\\u001f");
`,
			snapshot: `
RegExp("\\\\u001f");
        ~~~~~~~
        Unexpected control character '\\\\u001f' (U+001F) in regular expression.
`,
		},
	],
	valid: [
		`/foo/;`,
		`/\\n/;`,
		`/\\t/;`,
		`/\\r/;`,
		`/\\x20/;`,
		`/\\x7f/;`,
		`/\\u0020/;`,
		`new RegExp("foo");`,
		`new RegExp("\\\\n");`,
		`new RegExp(variable);`,
	],
});
