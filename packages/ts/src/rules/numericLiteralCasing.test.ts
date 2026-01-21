import rule from "./numericLiteralCasing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 0XFF;
`,
			snapshot: `
const value = 0XFF;
              ~~~~
              Prefer lowercase for the \`0x\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0xff;
`,
			snapshot: `
const value = 0xff;
              ~~~~
              Prefer lowercase for the \`0x\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0Xff;
`,
			snapshot: `
const value = 0Xff;
              ~~~~
              Prefer lowercase for the \`0x\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0O77;
`,
			snapshot: `
const value = 0O77;
              ~~~~
              Prefer lowercase for the \`0o\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0B1010;
`,
			snapshot: `
const value = 0B1010;
              ~~~~~~
              Prefer lowercase for the \`0b\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 1E10;
`,
			snapshot: `
const value = 1E10;
              ~~~~
              Prefer lowercase for the \`e\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 1.5E10;
`,
			snapshot: `
const value = 1.5E10;
              ~~~~~~
              Prefer lowercase for the \`e\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0XFFn;
`,
			snapshot: `
const value = 0XFFn;
              ~~~~~
              Prefer lowercase for the \`0x\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0xffn;
`,
			snapshot: `
const value = 0xffn;
              ~~~~~
              Prefer lowercase for the \`0x\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0O77n;
`,
			snapshot: `
const value = 0O77n;
              ~~~~~
              Prefer lowercase for the \`0o\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0B1010n;
`,
			snapshot: `
const value = 0B1010n;
              ~~~~~~~
              Prefer lowercase for the \`0b\` prefix and exponent notation.
`,
		},
		{
			code: `
const value = 0XFFFFn;
`,
			snapshot: `
const value = 0XFFFFn;
              ~~~~~~~
              Prefer lowercase for the \`0x\` prefix and exponent notation.
`,
		},
	],
	valid: [
		`const value = 0xFF;`,
		`const value = 0xABCD;`,
		`const value = 0o77;`,
		`const value = 0b1010;`,
		`const value = 1e10;`,
		`const value = 1.5e10;`,
		`const value = 1e-5;`,
		`const value = 0xFFn;`,
		`const value = 0o77n;`,
		`const value = 0b1010n;`,
		`const value = 123;`,
		`const value = 123n;`,
		`const value = 1.5;`,
	],
});
