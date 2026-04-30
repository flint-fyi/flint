import rule from "./regexUnicodeEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\u0041/u;
`,
			output: String.raw`
/\u{0041}/u;
`,
			snapshot: String.raw`
/\u0041/u;
 ~~~~~~
 Prefer the Unicode codepoint escape '\u{0041}' instead of 4-digit escape '\u0041'.
`,
		},
		{
			code: String.raw`
/\u00FF/u;
`,
			output: String.raw`
/\u{00FF}/u;
`,
			snapshot: String.raw`
/\u00FF/u;
 ~~~~~~
 Prefer the Unicode codepoint escape '\u{00FF}' instead of 4-digit escape '\u00FF'.
`,
		},
		{
			code: String.raw`
/[\u0041\u0042]/u;
`,
			output: String.raw`
/[\u{0041}\u{0042}]/u;
`,
			snapshot: String.raw`
/[\u0041\u0042]/u;
  ~~~~~~
  Prefer the Unicode codepoint escape '\u{0041}' instead of 4-digit escape '\u0041'.
        ~~~~~~
        Prefer the Unicode codepoint escape '\u{0042}' instead of 4-digit escape '\u0042'.
`,
		},
		{
			code: String.raw`
/[\u0041-\u005A]/u;
`,
			output: String.raw`
/[\u{0041}-\u{005A}]/u;
`,
			snapshot: String.raw`
/[\u0041-\u005A]/u;
  ~~~~~~
  Prefer the Unicode codepoint escape '\u{0041}' instead of 4-digit escape '\u0041'.
         ~~~~~~
         Prefer the Unicode codepoint escape '\u{005A}' instead of 4-digit escape '\u005A'.
`,
		},
		{
			code: String.raw`
/\u0041/v;
`,
			output: String.raw`
/\u{0041}/v;
`,
			snapshot: String.raw`
/\u0041/v;
 ~~~~~~
 Prefer the Unicode codepoint escape '\u{0041}' instead of 4-digit escape '\u0041'.
`,
		},
		{
			code: String.raw`
new RegExp("\\u0041", "u");
`,
			snapshot: String.raw`
new RegExp("\\u0041", "u");
            ~~~~~~
            Prefer the Unicode codepoint escape '\u{0041}' instead of 4-digit escape '\u0041'.
`,
		},
	],
	valid: [
		String.raw`/\u0041/;`,
		String.raw`/\u{0041}/u;`,
		String.raw`/\uD83D\uDE00/u;`,
		String.raw`/\x41/u;`,
		String.raw`/\cM/u;`,
		String.raw`/\0/u;`,
		`RegExp(variable, "u");`,
	],
});
