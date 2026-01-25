// flint-disable-file escapeSequenceCasing
import rule from "./regexUnicodeCodepointEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\uD83D\uDE00/u;
`,
			output: String.raw`
/\u{1F600}/u;
`,
			snapshot:
				String.raw`
/\uD83D\uDE00/u;
 ~~~~~~~~~~~~
 Prefer the more expressive Unicode codepoint escape ` +
				"`\\u{1F600}`" +
				String.raw` instead of surrogate pair ` +
				"`\\uD83D\\uDE00`" +
				String.raw`.
`,
		},
		{
			code: String.raw`
/\ud83d\ude00/u;
`,
			output: String.raw`
/\u{1f600}/u;
`,
			snapshot:
				String.raw`
/\ud83d\ude00/u;
 ~~~~~~~~~~~~
 Prefer the more expressive Unicode codepoint escape ` +
				"`\\u{1f600}`" +
				String.raw` instead of surrogate pair ` +
				"`\\ud83d\\ude00`" +
				String.raw`.
`,
		},
		{
			code: String.raw`
/[\uD83D\uDE00]/u;
`,
			output: String.raw`
/[\u{1F600}]/u;
`,
			snapshot:
				String.raw`
/[\uD83D\uDE00]/u;
  ~~~~~~~~~~~~
  Prefer the more expressive Unicode codepoint escape ` +
				"`\\u{1F600}`" +
				String.raw` instead of surrogate pair ` +
				"`\\uD83D\\uDE00`" +
				String.raw`.
`,
		},
		{
			code: String.raw`
/\uD83D\uDE00/v;
`,
			output: String.raw`
/\u{1F600}/v;
`,
			snapshot:
				String.raw`
/\uD83D\uDE00/v;
 ~~~~~~~~~~~~
 Prefer the more expressive Unicode codepoint escape ` +
				"`\\u{1F600}`" +
				String.raw` instead of surrogate pair ` +
				"`\\uD83D\\uDE00`" +
				String.raw`.
`,
		},
		{
			code: String.raw`
new RegExp("\\uD83D\\uDE00", "u");
`,
			output: String.raw`
new RegExp("\\u{1F600}", "u");
`,
			snapshot:
				String.raw`
new RegExp("\\uD83D\\uDE00", "u");
            ~~~~~~~~~~~~~~
            Prefer the more expressive Unicode codepoint escape ` +
				"`\\u{1F600}`" +
				String.raw` instead of surrogate pair ` +
				"`\\uD83D\\uDE00`" +
				String.raw`.
`,
		},
		{
			code: String.raw`
/\uD83D\uDE00\uD83D\uDE01/u;
`,
			output: String.raw`
/\u{1F600}\u{1F601}/u;
`,
			snapshot:
				String.raw`
/\uD83D\uDE00\uD83D\uDE01/u;
 ~~~~~~~~~~~~
 Prefer the more expressive Unicode codepoint escape ` +
				"`\\u{1F600}`" +
				String.raw` instead of surrogate pair ` +
				"`\\uD83D\\uDE00`" +
				String.raw`.
             ~~~~~~~~~~~~
             Prefer the more expressive Unicode codepoint escape ` +
				"`\\u{1F601}`" +
				String.raw` instead of surrogate pair ` +
				"`\\uD83D\\uDE01`" +
				String.raw`.
`,
		},
	],
	valid: [
		String.raw`/\uD83D\uDE00/;`,
		String.raw`/\uD83D\uDE00/g;`,
		String.raw`/\u{1F600}/u;`,
		`/😀/u;`,
		String.raw`/\u0041\u0042/u;`,
		`RegExp(variable, "u");`,
	],
});
