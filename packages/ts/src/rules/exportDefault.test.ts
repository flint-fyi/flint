import rule from "./exportDefault.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export const value = 1;
`,
			snapshot: `
export const value = 1;
             ~~~~~~~~~
             A single named export was found. Prefer using a default export when there is only one export.
`,
		},
		{
			code: `
export function getValue() {
    return 1;
}
`,
			snapshot: `
export function getValue() {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
A single named export was found. Prefer using a default export when there is only one export.
    return 1;
    ~~~~~~~~~
}
~
`,
		},
		{
			code: `
export class Example {}
`,
			snapshot: `
export class Example {}
~~~~~~~~~~~~~~~~~~~~~~~
A single named export was found. Prefer using a default export when there is only one export.
`,
		},
		{
			code: `
export { value };
const value = 1;
`,
			snapshot: `
export { value };
         ~~~~~
         A single named export was found. Prefer using a default export when there is only one export.
const value = 1;
`,
		},
		{
			code: `
export const value = 1;
export const other = 2;
`,
			options: { target: "any" },
			snapshot: `
export const value = 1;
             ~~~~~~~~~
             A single named export was found. Prefer using a default export when there is only one export.
export const other = 2;
`,
		},
	],
	valid: [
		`export default function getValue() { return 1; }`,
		`export default class Example {}`,
		`export default 42;`,
		`export const a = 1; export const b = 2;`,
		`export function a() {} export function b() {}`,
		`export type MyType = string;`,
		`export interface MyInterface {}`,
		`export { value }; export default other;`,
		`// no exports`,
	],
});
