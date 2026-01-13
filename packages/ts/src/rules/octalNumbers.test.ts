import rule from "./octalNumbers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 07;
`,
			snapshot: `
const value = 07;
              ~~
              This legacy octal numeric literal evaluates to 7. Did you mean that value, or to use a modern octal syntax such as 0o7?
`,
			suggestions: [
				{
					id: "useModernOctalSyntax",
					updated: `
const value = 0o7;
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const value = 7;
`,
				},
			],
		},
		{
			code: `
const value = 077;
`,
			snapshot: `
const value = 077;
              ~~~
              This legacy octal numeric literal evaluates to 63. Did you mean that value, or to use a modern octal syntax such as 0o77?
`,
			suggestions: [
				{
					id: "useModernOctalSyntax",
					updated: `
const value = 0o77;
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const value = 77;
`,
				},
			],
		},
		{
			code: `
const value = 0123;
`,
			snapshot: `
const value = 0123;
              ~~~~
              This legacy octal numeric literal evaluates to 83. Did you mean that value, or to use a modern octal syntax such as 0o123?
`,
			suggestions: [
				{
					id: "useModernOctalSyntax",
					updated: `
const value = 0o123;
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const value = 123;
`,
				},
			],
		},
		{
			code: `
const value = 01234567;
`,
			snapshot: `
const value = 01234567;
              ~~~~~~~~
              This legacy octal numeric literal evaluates to 342391. Did you mean that value, or to use a modern octal syntax such as 0o1234567?
`,
			suggestions: [
				{
					id: "useModernOctalSyntax",
					updated: `
const value = 0o1234567;
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const value = 1234567;
`,
				},
			],
		},
		{
			code: `
const values = [01, 02, 03];
`,
			snapshot: `
const values = [01, 02, 03];
                ~~
                This legacy octal numeric literal evaluates to 1. Did you mean that value, or to use a modern octal syntax such as 0o1?
                    ~~
                    This legacy octal numeric literal evaluates to 2. Did you mean that value, or to use a modern octal syntax such as 0o2?
                        ~~
                        This legacy octal numeric literal evaluates to 3. Did you mean that value, or to use a modern octal syntax such as 0o3?
`,
			suggestions: [
				{
					id: "useModernOctalSyntax",
					updated: `
const values = [0o1, 02, 03];
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const values = [1, 02, 03];
`,
				},
				{
					id: "useModernOctalSyntax",
					updated: `
const values = [01, 0o2, 03];
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const values = [01, 2, 03];
`,
				},
				{
					id: "useModernOctalSyntax",
					updated: `
const values = [01, 02, 0o3];
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const values = [01, 02, 3];
`,
				},
			],
		},
		{
			code: `
function calculate() {
	return 077;
}
`,
			snapshot: `
function calculate() {
	return 077;
	       ~~~
	       This legacy octal numeric literal evaluates to 63. Did you mean that value, or to use a modern octal syntax such as 0o77?
}
`,
			suggestions: [
				{
					id: "useModernOctalSyntax",
					updated: `
function calculate() {
	return 0o77;
}
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
function calculate() {
	return 77;
}
`,
				},
			],
		},
		{
			code: `
const result = 010 + 020;
`,
			snapshot: `
const result = 010 + 020;
               ~~~
               This legacy octal numeric literal evaluates to 8. Did you mean that value, or to use a modern octal syntax such as 0o10?
                     ~~~
                     This legacy octal numeric literal evaluates to 16. Did you mean that value, or to use a modern octal syntax such as 0o20?
`,
			suggestions: [
				{
					id: "useModernOctalSyntax",
					updated: `
const result = 0o10 + 020;
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const result = 10 + 020;
`,
				},
				{
					id: "useModernOctalSyntax",
					updated: `
const result = 010 + 0o20;
`,
				},
				{
					id: "removeLeadingZero",
					updated: `
const result = 010 + 20;
`,
				},
			],
		},
	],
	valid: [
		`const value = 0;`,
		`const value = 1;`,
		`const value = 10;`,
		`const value = 100;`,
		`const value = 0x7F;`,
		`const value = 0o77;`,
		`const value = 0O77;`,
		`const value = 0b111;`,
		`const value = 0B111;`,
		`const value = 0.8;`,
		`const value = 8;`,
		`const value = 9;`,
		`const value = 123;`,
		`const values = [0, 1, 10, 100];`,
		`const hex = 0xFF;`,
		`const binary = 0b1010;`,
		`const octal = 0o755;`,
		`const notOctal = 08;`,
		`const alsoNotOctal = 09;`,
	],
});
