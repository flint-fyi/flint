import rule from "./numericErasingOperations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
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
const value = 0 * x;
`,
			snapshot: `
const value = 0 * x;
              ~~~~~
              This expression will always evaluate to zero.
`,
		},
		{
			code: `
const value = x & 0;
`,
			snapshot: `
const value = x & 0;
              ~~~~~
              This expression will always evaluate to zero.
`,
		},
		{
			code: `
const value = 0 & x;
`,
			snapshot: `
const value = 0 & x;
              ~~~~~
              This expression will always evaluate to zero.
`,
		},
		{
			code: `
const value = 0 / x;
`,
			snapshot: `
const value = 0 / x;
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
		`const value = x * 1;`,
		`const value = 1 * x;`,
		`const value = 5 & x;`,
		`const value = x / 1;`,
		`const value = 1 / x;`,
		`const value = 0 / 0;`,
		`const value = x / 0;`,
		`const value = x + 0;`,
		`const value = x - 0;`,
		`const value = x | 0;`,
		`const value = x ^ 0;`,
	],
});
