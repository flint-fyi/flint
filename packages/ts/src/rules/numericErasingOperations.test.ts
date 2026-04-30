import rule from "./numericErasingOperations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
x * 0;
`,
			snapshot: `
x * 0;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
0 * x;
`,
			snapshot: `
0 * x;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
x & 0;
`,
			snapshot: `
x & 0;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
0 & x;
`,
			snapshot: `
0 & x;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
0 / x;
`,
			snapshot: `
0 / x;
~~~~~
This expression will always evaluate to zero.
`,
		},
		{
			code: `
const value = x * 0;
`,
			snapshot: `
const value = x * 0;
              ~~~~~
              This expression will always evaluate to zero.
`,
		},
		{
			code: `
const result = (a + b) * 0;
`,
			snapshot: `
const result = (a + b) * 0;
               ~~~~~~~~~~~
               This expression will always evaluate to zero.
`,
		},
		{
			code: `
const result = 0 * (a + b);
`,
			snapshot: `
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
		`console.log(x * 1);`,
		`const value = x * 1;`,
		`x * 1;`,
		`1 * x;`,
		`5 & x;`,
		`x / 1;`,
		`1 / x;`,
		`0 / 0;`,
		`x / 0;`,
		`x + 0;`,
		`x - 0;`,
		`x | 0;`,
		`x ^ 0;`,
	],
});
