// flint-disable-file ts/escapeSequenceCasing
import rule from "./regexControlCharacterEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\x00/;
`,
			output: String.raw`
/\0/;
`,
			snapshot: String.raw`
/\x00/;
 ~~~~
 Prefer standard escape sequence '\0' over '\x00'.
`,
		},
		{
			code: String.raw`
/\x0a/;
`,
			output: String.raw`
/\n/;
`,
			snapshot: String.raw`
/\x0a/;
 ~~~~
 Prefer standard escape sequence '\n' over '\x0a'.
`,
		},
		{
			code: String.raw`
/\x09/;
`,
			output: String.raw`
/\t/;
`,
			snapshot: String.raw`
/\x09/;
 ~~~~
 Prefer standard escape sequence '\t' over '\x09'.
`,
		},
		{
			code: String.raw`
/\x0d/;
`,
			output: String.raw`
/\r/;
`,
			snapshot: String.raw`
/\x0d/;
 ~~~~
 Prefer standard escape sequence '\r' over '\x0d'.
`,
		},
		{
			code: String.raw`
/\u000a/;
`,
			output: String.raw`
/\n/;
`,
			snapshot: String.raw`
/\u000a/;
 ~~~~~~
 Prefer standard escape sequence '\n' over '\u000a'.
`,
		},
		{
			code: String.raw`
/\cJ/;
`,
			output: String.raw`
/\n/;
`,
			snapshot: String.raw`
/\cJ/;
 ~~~
 Prefer standard escape sequence '\n' over '\cJ'.
`,
		},
		{
			code: String.raw`
/\u{a}/u;
`,
			output: String.raw`
/\n/u;
`,
			snapshot: String.raw`
/\u{a}/u;
 ~~~~~
 Prefer standard escape sequence '\n' over '\u{a}'.
`,
		},
		{
			code: String.raw`
new RegExp("\\x0a");
`,
			output: String.raw`
new RegExp("\\n");
`,
			snapshot: String.raw`
new RegExp("\\x0a");
            ~~~~~
            Prefer standard escape sequence '\\n' over '\\x0a'.
`,
		},
	],
	valid: [
		String.raw`/\0\t\n\v\f\r/;`,
		String.raw`/\0/;`,
		String.raw`/\t/;`,
		String.raw`/\n/;`,
		String.raw`/\r/;`,
		`/foo/;`,
		String.raw`/\x1f/;`,
		String.raw`new RegExp("\\0\\t\\n\\v\\f\\r");`,
		`new RegExp("foo");`,
		`new RegExp(variable);`,
	],
});
