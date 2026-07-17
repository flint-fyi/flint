import rule from "./octalEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
String.raw\`\\1\`;
`,
			snapshot: `
String.raw\`\\1\`;
           ~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
String.raw\`\\01\`;
`,
			snapshot: `
String.raw\`\\01\`;
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
String.raw\`\\377\`;
`,
			snapshot: `
String.raw\`\\377\`;
           ~~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
String.raw\`before\\1after\`;
`,
			snapshot: `
String.raw\`before\\1after\`;
                 ~~
                 Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const x = 5;
String.raw\`value: \${x} \\1\`;
`,
			snapshot: `
const x = 5;
String.raw\`value: \${x} \\1\`;
                       ~~
                       Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
		{
			code: `
const x = 5;
String.raw\`\\01 value: \${x}\`;
`,
			snapshot: `
const x = 5;
String.raw\`\\01 value: \${x}\`;
           ~~~
           Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.
`,
		},
	],
	valid: [
		String.raw`const a = "\0";`,
		String.raw`const a = "\\8";`,
		String.raw`const a = "\\9";`,
		String.raw`const a = "\x01";`,
		String.raw`const a = "\u0001";`,
		String.raw`const a = "\n";`,
		String.raw`const a = "\t";`,
		String.raw`const a = "\\0";`,
		String.raw`const a = "\\1";`,
		String.raw`const a = "before\0after";`,
		String.raw`const a = "before\\8after";`,
		String.raw`const a = "before\\9after";`,
		String.raw`const a = '\0';`,
		String.raw`const a = '\\8';`,
		String.raw`const a = '\\9';`,
		`const a = \`\\0\`;`,
		`const a = \`\\\\8\`;`,
		`const a = \`\\\\9\`;`,
		`
const x = 5;
const a = \`value: \${x} \\0\`;
`,
		`
const x = 5;
const a = \`\\0 value: \${x}\`;
`,
		`
const x = 5;
const a = \`\\\\8 \${x} \\\\9\`;
`,
	],
});
