import rule from "./numericErasingOperations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const x: number;
x * 0;
`,
			snapshot: `
declare const x: number;
x * 0;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
declare const x: number;
0 * x;
`,
			snapshot: `
declare const x: number;
0 * x;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
declare const x: number;
x & 0;
`,
			snapshot: `
declare const x: number;
x & 0;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
declare const x: number;
0 & x;
`,
			snapshot: `
declare const x: number;
0 & x;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
declare const x: number;
0 / x;
`,
			snapshot: `
declare const x: number;
0 / x;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
declare const x: number;
const value = x * 0;
`,
			snapshot: `
declare const x: number;
const value = x * 0;
              ~~~~~
              This expression will always evaluate to zero.
`,
		},
		{
			code: `
declare const a: number;
declare const b: number;
const result = (a + b) * 0;
`,
			snapshot: `
declare const a: number;
declare const b: number;
const result = (a + b) * 0;
               ~~~~~~~~~~~
               This expression will always evaluate to zero.
`,
		},
		{
			code: `
declare const a: number;
declare const b: number;
const result = 0 * (a + b);
`,
			snapshot: `
declare const a: number;
declare const b: number;
const result = 0 * (a + b);
               ~~~~~~~~~~~
               This expression will always evaluate to zero.
`,
		},
		{
			code: `
function getValue(x: number) { return x * 0; }
`,
			snapshot: `
function getValue(x: number) { return x * 0; }
                                      ~~~~~
                                      This expression will always evaluate to zero.
`,
		},
	],
	valid: [
		`
declare const console: { log(value: number): void };
declare const x: number;
console.log(x * 1);
`,
		`
declare const x: number;
const value = x * 1;
`,
		`
declare const x: number;
x * 1;
`,
		`
declare const x: number;
1 * x;
`,
		`
declare const x: number;
5 & x;
`,
		`
declare const x: number;
x / 1;
`,
		`
declare const x: number;
1 / x;
`,
		`0 / 0;`,
		`
declare const x: number;
x / 0;
`,
		`
declare const x: number;
x + 0;
`,
		`
declare const x: number;
x - 0;
`,
		`
declare const x: number;
x | 0;
`,
		`
declare const x: number;
x ^ 0;
`,
	],
});
