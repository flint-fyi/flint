import rule from "./numericLiteralParsing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const binary = parseInt("111110111", 2);
`,
			snapshot: `
const binary = parseInt("111110111", 2);
               ~~~~~~~~~~~~~~~~~~~~~~~~
               Use 0b111110111 instead of parseInt with radix 2.
`,
		},
		{
			code: `
const octal = parseInt("767", 8);
`,
			snapshot: `
const octal = parseInt("767", 8);
              ~~~~~~~~~~~~~~~~~~
              Use 0o767 instead of parseInt with radix 8.
`,
		},
		{
			code: `
const hex = parseInt("1F7", 16);
`,
			snapshot: `
const hex = parseInt("1F7", 16);
            ~~~~~~~~~~~~~~~~~~~
            Use 0x1F7 instead of parseInt with radix 16.
`,
		},
		{
			code: `
const value = Number.parseInt("111110111", 2);
`,
			snapshot: `
const value = Number.parseInt("111110111", 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Use 0b111110111 instead of parseInt with radix 2.
`,
		},
		{
			code: `
const result = Number.parseInt("767", 8);
`,
			snapshot: `
const result = Number.parseInt("767", 8);
               ~~~~~~~~~~~~~~~~~~~~~~~~~
               Use 0o767 instead of parseInt with radix 8.
`,
		},
		{
			code: `
const num = Number.parseInt("1F7", 16);
`,
			snapshot: `
const num = Number.parseInt("1F7", 16);
            ~~~~~~~~~~~~~~~~~~~~~~~~~~
            Use 0x1F7 instead of parseInt with radix 16.
`,
		},
		{
			code: `
const value = parseInt(\`111110111\`, 2);
`,
			snapshot: `
const value = parseInt(\`111110111\`, 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Use 0b111110111 instead of parseInt with radix 2.
`,
		},
	],
	valid: [
		`const decimal = parseInt("123");`,
		`const value = parseInt("123", 10);`,
		`const ternary = parseInt("102", 3);`,
		`const binary = 0b111110111;`,
		`const octal = 0o767;`,
		`const hex = 0x1F7;`,
		`const dynamic = parseInt(value, 2);`,
		`const variable = parseInt("111", radix);`,
		`const single = parseInt("111");`,
		`Number.parseInt("123");`,
		`Number.parseInt("123", 10);`,
		`
			function parseInt(...values: unknown[]) {}
			parseInt("1", 2);
			export {};
		`,
		`
			const Number = { parseInt(...values: unknown[]) {} };
			Number.parseInt("1", 2);
			export {};
		`,
	],
});
