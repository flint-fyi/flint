// flint-disable-file escapeSequenceCasing -- Lowercase escapes are intentional in test cases
import rule from "./regexInvisibleCharacters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/\t/;
`,
			output: `
/\\x09/;
`,
			snapshot: `
/\t/;
 ~
 Unexpected invisible character. Use '\\x09' instead.
`,
		},
		{
			code: `
/\u00a0/;
`,
			output: `
/\\xA0/;
`,
			snapshot: `
/\u00a0/;
 ~
 Unexpected invisible character. Use '\\xA0' instead.
`,
		},
		{
			code: `
/\u200b/;
`,
			output: `
/\\u200B/;
`,
			snapshot: `
/\u200b/;
 ~
 Unexpected invisible character. Use '\\u200B' instead.
`,
		},
		{
			code: `
/\u200b/u;
`,
			output: `
/\\u{200B}/u;
`,
			snapshot: `
/\u200b/u;
 ~
 Unexpected invisible character. Use '\\u{200B}' instead.
`,
		},
	],
	valid: [
		`/ /;`,
		String.raw`/\t/;`,
		String.raw`/\n/;`,
		String.raw`/\r/;`,
		String.raw`/\x09/;`,
		String.raw`/\x0A/;`,
		String.raw`/\x0D/;`,
		String.raw`/\u00A0/;`,
		String.raw`/\u200B/;`,
		`/abc/;`,
	],
});
