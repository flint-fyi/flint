import rule from "./exponentiationOperators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = Math.pow(2, 8);
`,
			output: `
const result = 2 ** 8;
`,
			snapshot: `
const result = Math.pow(2, 8);
               ~~~~~~~~~~~~~~
               Prefer the more succinct \`**\` operator instead of Math.pow() for exponentiation.
`,
		},
		{
			code: `
declare const x: number;

const squared = Math.pow(x, 2);
`,
			output: `
declare const x: number;

const squared = x ** 2;
`,
			snapshot: `
declare const x: number;

const squared = Math.pow(x, 2);
                ~~~~~~~~~~~~~~
                Prefer the more succinct \`**\` operator instead of Math.pow() for exponentiation.
`,
		},
		{
			code: `
declare const x: number;

const cubed = Math.pow(x, 3);
`,
			output: `
declare const x: number;

const cubed = x ** 3;
`,
			snapshot: `
declare const x: number;

const cubed = Math.pow(x, 3);
              ~~~~~~~~~~~~~~
              Prefer the more succinct \`**\` operator instead of Math.pow() for exponentiation.
`,
		},
	],
	valid: [
		`const result = 2 ** 8;`,
		`
declare const x: number;
const squared = x ** 2;
`,
		`const result = Math.sqrt(4);`,
		`const myMath = { pow: (a: number, b: number) => a + b }; myMath.pow(2, 3);`,
	],
});
