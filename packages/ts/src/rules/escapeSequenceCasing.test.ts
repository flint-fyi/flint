// flint-disable-file ts/escapeSequenceCasing
import rule from "./escapeSequenceCasing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
'\xa9';
`,
			output: String.raw`
'\xA9';
`,
			snapshot: String.raw`
'\xa9';
 ~~~~
 Prefer uppercase characters for escape sequence '\xa9'.
`,
		},
		{
			code: String.raw`
'\ud834';
`,
			output: String.raw`
'\uD834';
`,
			snapshot: String.raw`
'\ud834';
 ~~~~~~
 Prefer uppercase characters for escape sequence '\ud834'.
`,
		},
		{
			code: String.raw`
'\u{1d306}';
`,
			output: String.raw`
'\u{1D306}';
`,
			snapshot: String.raw`
'\u{1d306}';
 ~~~~~~~~~
 Prefer uppercase characters for escape sequence '\u{1d306}'.
`,
		},
		{
			code: String.raw`
'\ca';
`,
			output: String.raw`
'\cA';
`,
			snapshot: String.raw`
'\ca';
 ~~~
 Prefer uppercase characters for escape sequence '\ca'.
`,
		},
		{
			code: String.raw`
"\xa9";
`,
			output: String.raw`
"\xA9";
`,
			snapshot: String.raw`
"\xa9";
 ~~~~
 Prefer uppercase characters for escape sequence '\xa9'.
`,
		},
		{
			code: `
\`\\xa9\`;
`,
			output: `
\`\\xA9\`;
`,
			snapshot: `
\`\\xa9\`;
 ~~~~
 Prefer uppercase characters for escape sequence '\\xa9'.
`,
		},
		{
			code: `
const x = 5;
\`value: \${x} \\xa9\`;
`,
			output: `
const x = 5;
\`value: \${x} \\xA9\`;
`,
			snapshot: `
const x = 5;
\`value: \${x} \\xa9\`;
             ~~~~
             Prefer uppercase characters for escape sequence '\\xa9'.
`,
		},
	],
	valid: [
		String.raw`'\xA9';`,
		String.raw`'\uD834';`,
		String.raw`'\u{1D306}';`,
		String.raw`'\cA';`,
		String.raw`"\xA9";`,
		`\`\\xA9\`;`,
		`'hello';`,
		String.raw`'\n\t\r';`,
	],
});
