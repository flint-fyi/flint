import rule from "./exportGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export const a = 1;
export const b = 2;
`,
			snapshot: `
export const a = 1;
export const b = 2;
~~~~~~~~~~~~~~~~~~~
Multiple named exports found. Group all named exports in a single export statement.
`,
		},
		{
			code: `
export function getValue() { return 1; }
export function getOther() { return 2; }
`,
			snapshot: `
export function getValue() { return 1; }
export function getOther() { return 2; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Multiple named exports found. Group all named exports in a single export statement.
`,
		},
		{
			code: `
const a = 1;
const b = 2;
export { a };
export { b };
`,
			snapshot: `
const a = 1;
const b = 2;
export { a };
export { b };
~~~~~~~~~~~~~
Multiple named exports found. Group all named exports in a single export statement.
`,
		},
	],
	valid: [
		`export const value = 1;`,
		`const a = 1; const b = 2; export { a, b };`,
		`export default function getValue() { return 1; }`,
		`export type MyType = string;`,
		`export { value } from './other';`,
	],
});
