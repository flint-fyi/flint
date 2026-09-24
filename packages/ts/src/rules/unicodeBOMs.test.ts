// flint-disable-file flint/invalidCodeLines -- This rule checks the first character of code files.
import { ruleTester } from "./ruleTester.ts";
import rule from "./unicodeBOMs.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `\u{FEFF}const value = 1;
`,
			snapshot: `\u{FEFF}const value = 1;
~
This Unicode Byte Order Mark (BOM) is unnecessary and can cause issues with some tools.
`,
			suggestions: [
				{
					id: "removeBOM",
					updated: `const value = 1;
`,
				},
			],
		},
		{
			code: `\u{FEFF}// Comment
const value = 1;
`,
			snapshot: `\u{FEFF}// Comment
~
This Unicode Byte Order Mark (BOM) is unnecessary and can cause issues with some tools.
const value = 1;
`,
			suggestions: [
				{
					id: "removeBOM",
					updated: `// Comment
const value = 1;
`,
				},
			],
		},
		{
			code: `\u{FEFF}
const value = 1;
`,
			snapshot: `\u{FEFF}
~
This Unicode Byte Order Mark (BOM) is unnecessary and can cause issues with some tools.
const value = 1;
`,
			suggestions: [
				{
					id: "removeBOM",
					updated: `
const value = 1;
`,
				},
			],
		},
	],
	valid: [
		`const value = 1;`,
		`// Comment at the start
const value = 1;`,
		`
const value = 1;`,
		`function test() { return 42; }`,
	],
});
