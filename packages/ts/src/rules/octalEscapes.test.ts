import rule from "./octalEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const a = "\\1";
`,
			snapshot: `
const a = "\\1";
           ~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\2";
`,
			snapshot: `
const a = "\\2";
           ~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\7";
`,
			snapshot: `
const a = "\\7";
           ~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\00";
`,
			snapshot: `
const a = "\\00";
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\01";
`,
			snapshot: `
const a = "\\01";
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\02";
`,
			snapshot: `
const a = "\\02";
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\07";
`,
			snapshot: `
const a = "\\07";
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\377";
`,
			snapshot: `
const a = "\\377";
           ~~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "\\12";
`,
			snapshot: `
const a = "\\12";
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "before\\1after";
`,
			snapshot: `
const a = "before\\1after";
                 ~~
                 Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = "before\\01after";
`,
			snapshot: `
const a = "before\\01after";
                 ~~~
                 Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = '\\1';
`,
			snapshot: `
const a = '\\1';
           ~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = '\\01';
`,
			snapshot: `
const a = '\\01';
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = \`\\1\`;
`,
			snapshot: `
const a = \`\\1\`;
           ~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = \`\\01\`;
`,
			snapshot: `
const a = \`\\01\`;
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const a = \`before\\1after\`;
`,
			snapshot: `
const a = \`before\\1after\`;
                 ~~
                 Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const x = 5;
const a = \`value: \${x} \\1\`;
`,
			snapshot: `
const x = 5;
const a = \`value: \${x} \\1\`;
                       ~~
                       Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const x = 5;
const a = \`\\01 value: \${x}\`;
`,
			snapshot: `
const x = 5;
const a = \`\\01 value: \${x}\`;
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
	],
	valid: [
		`const a = "\\0";`,
		`const a = "\\8";`,
		`const a = "\\9";`,
		`const a = "\\x01";`,
		`const a = "\\u0001";`,
		`const a = "\\n";`,
		`const a = "\\t";`,
		`const a = "\\\\0";`,
		`const a = "\\\\1";`,
		`const a = "before\\0after";`,
		`const a = "before\\8after";`,
		`const a = "before\\9after";`,
		`const a = '\\0';`,
		`const a = '\\8';`,
		`const a = '\\9';`,
		`const a = \`\\0\`;`,
		`const a = \`\\8\`;`,
		`const a = \`\\9\`;`,
		`const x = 5; const a = \`value: \${x} \\0\`;`,
		`const x = 5; const a = \`\\0 value: \${x}\`;`,
		`const x = 5; const a = \`\\8 \${x} \\9\`;`,
	],
});
