// flint-disable-file escapeSequenceCasing
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
			snapshot: `
/\\u000a/;
 ~~~~~~
 Prefer the more succinct hexadecimal escape \`\\x0a\` over unicode escape \`\\u000a\`.
`,
		},
		{
			code: String.raw`
/\u{a}/u;
`,
			output: String.raw`
/\x0a/u;
`,
			snapshot: `
/\\u{a}/u;
 ~~~~~
 Prefer the more succinct hexadecimal escape \`\\x0a\` over unicode escape \`\\u{a}\`.
`,
		},
		{
			code: String.raw`
/\u{00ff}/u;
`,
			output: String.raw`
/\xff/u;
`,
			snapshot: `
/\\u{00ff}/u;
 ~~~~~~~~
 Prefer the more succinct hexadecimal escape \`\\xff\` over unicode escape \`\\u{00ff}\`.
`,
		},
		{
			code: String.raw`
/[\q{\u000a}]/v;
`,
			output: String.raw`
/[\q{\x0a}]/v;
`,
			snapshot: `
/[\\q{\\u000a}]/v;
     ~~~~~~
     Prefer the more succinct hexadecimal escape \`\\x0a\` over unicode escape \`\\u000a\`.
`,
		},
		{
			code: String.raw`
/\u000a \u{00000a}/u;
`,
			output: String.raw`
/\x0a \x0a/u;
`,
			snapshot: `
/\\u000a \\u{00000a}/u;
 ~~~~~~
 Prefer the more succinct hexadecimal escape \`\\x0a\` over unicode escape \`\\u000a\`.
        ~~~~~~~~~~
        Prefer the more succinct hexadecimal escape \`\\x0a\` over unicode escape \`\\u{00000a}\`.
`,
		},
		{
			code: String.raw`
/[\q{\u000a \u{00000a}}]/v;
`,
			output: String.raw`
/[\q{\x0a \x0a}]/v;
`,
			snapshot: `
/[\\q{\\u000a \\u{00000a}}]/v;
     ~~~~~~
     Prefer the more succinct hexadecimal escape \`\\x0a\` over unicode escape \`\\u000a\`.
            ~~~~~~~~~~
            Prefer the more succinct hexadecimal escape \`\\x0a\` over unicode escape \`\\u{00000a}\`.
`,
		},
	],
	valid: [
		String.raw`/a \x0a \cM \0/;`,
		String.raw`/\x0a \x0b \x41/u;`,
		String.raw`/\u0100/u;`,
		String.raw`/\u{100}/u;`,
		String.raw`/\u0100 \u{100}/u;`,
		String.raw`/\7/;`,
		String.raw`/\cA \cB \cM/;`,
		String.raw`/[\q{\x0a}]/v;`,
		String.raw`/abc/;`,
		String.raw`/a \x0a \cM \0 \u0100 \u{100}/u;`,
	],
});
