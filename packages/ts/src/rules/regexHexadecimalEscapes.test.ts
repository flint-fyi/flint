// flint-disable-file escapeSequenceCasing -- Lowercase escapes are intentional in test cases
import rule from "./regexHexadecimalEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\u000a/;
`,
			output: String.raw`
/\x0a/;
`,
			snapshot: String.raw`
/\u000a/;
 ~~~~~~
 Prefer hexadecimal escape '\x0a' over unicode escape '\u000a'.
`,
		},
		{
			code: String.raw`
/\u{a}/u;
`,
			output: String.raw`
/\x0a/u;
`,
			snapshot: String.raw`
/\u{a}/u;
 ~~~~~
 Prefer hexadecimal escape '\x0a' over unicode escape '\u{a}'.
`,
		},
		{
			code: String.raw`
/\u{00ff}/u;
`,
			output: String.raw`
/\xff/u;
`,
			snapshot: String.raw`
/\u{00ff}/u;
 ~~~~~~~~
 Prefer hexadecimal escape '\xff' over unicode escape '\u{00ff}'.
`,
		},
		{
			code: String.raw`
/[\q{\u000a}]/v;
`,
			output: String.raw`
/[\q{\x0a}]/v;
`,
			snapshot: String.raw`
/[\q{\u000a}]/v;
     ~~~~~~
     Prefer hexadecimal escape '\x0a' over unicode escape '\u000a'.
`,
		},
	],
	valid: [
		String.raw`/a \x0a \cM \0/;`,
		String.raw`/\x0a \x0b \x41/u;`,
		String.raw`/\u0100/u;`,
		String.raw`/\u{100}/u;`,
		String.raw`/\7/;`,
		String.raw`/\cA \cB \cM/;`,
		String.raw`/[\q{\x0a}]/v;`,
	],
});
