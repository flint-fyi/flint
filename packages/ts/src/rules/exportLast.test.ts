import rule from "./exportLast.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export const a = 1;
const b = 2;
`,
			snapshot: `
export const a = 1;
~~~~~~~~~~~~~~~~~~~
Export statement should be at the end of the file.
const b = 2;
`,
		},
		{
			code: `
export function getValue() { return 1; }
const value = 2;
export const other = 3;
`,
			snapshot: `
export function getValue() { return 1; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Export statement should be at the end of the file.
const value = 2;
export const other = 3;
`,
		},
		{
			code: `
const a = 1;
export { a };
const b = 2;
`,
			snapshot: `
const a = 1;
export { a };
~~~~~~~~~~~~~
Export statement should be at the end of the file.
const b = 2;
`,
		},
	],
	valid: [
		`const a = 1; export { a };`,
		`const a = 1; const b = 2; export { a, b };`,
		`const value = 1; export default value;`,
		`function getValue() { return 1; } export { getValue };`,
		`export const a = 1;`,
		`export default function getValue() { return 1; }`,
	],
});
