// flint-disable-file escapeSequenceCasing
import rule from "./escapeSequenceCasing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
'\\xa9';
`,
			output: `
'\\xA9';
`,
			snapshot: `
'\\xa9';
 ~~~~
 Prefer uppercase characters for escape sequence '\\xa9'.
`,
		},
		{
			code: `
'\\ud834';
`,
			output: `
'\\uD834';
`,
			snapshot: `
'\\ud834';
 ~~~~~~
 Prefer uppercase characters for escape sequence '\\ud834'.
`,
		},
		{
			code: `
'\\u{1d306}';
`,
			output: `
'\\u{1D306}';
`,
			snapshot: `
'\\u{1d306}';
 ~~~~~~~~~
 Prefer uppercase characters for escape sequence '\\u{1d306}'.
`,
		},
		{
			code: `
'\\ca';
`,
			output: `
'\\cA';
`,
			snapshot: `
'\\ca';
 ~~~
 Prefer uppercase characters for escape sequence '\\ca'.
`,
		},
		{
			code: `
"\\xa9";
`,
			output: `
"\\xA9";
`,
			snapshot: `
"\\xa9";
 ~~~~
 Prefer uppercase characters for escape sequence '\\xa9'.
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
		`'\\xA9';`,
		`'\\uD834';`,
		`'\\u{1D306}';`,
		`'\\cA';`,
		`"\\xA9";`,
		`\`\\xA9\`;`,
		`'hello';`,
		`'\\n\\t\\r';`,
	],
});
