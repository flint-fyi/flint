import rule from "./emptyExports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { something } from "module";
export {};
`,
			output: `
import { something } from "module";

`,
			snapshot: `
import { something } from "module";
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
`,
		},
		{
			code: `
export const value = 1;
export {};
`,
			output: `
export const value = 1;

`,
			snapshot: `
export const value = 1;
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
`,
		},
		{
			code: `
export function getValue() {}
export {};
`,
			output: `
export function getValue() {}

`,
			snapshot: `
export function getValue() {}
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
`,
		},
		{
			code: `
export class MyClass {}
export {};
`,
			output: `
export class MyClass {}

`,
			snapshot: `
export class MyClass {}
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
`,
		},
		{
			code: `
export * from "module";
export {};
`,
			output: `
export * from "module";

`,
			snapshot: `
export * from "module";
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
`,
		},
		{
			code: `
export default 1;
export {};
`,
			output: `
export default 1;

`,
			snapshot: `
export default 1;
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
`,
		},
		{
			code: `
export {};
import { something } from "module";
`,
			output: `

import { something } from "module";
`,
			snapshot: `
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
import { something } from "module";
`,
		},
		{
			code: `
export type { MyType } from "module";
export {};
`,
			output: `
export type { MyType } from "module";

`,
			snapshot: `
export type { MyType } from "module";
export {};
~~~~~~~~~~
This empty export is unnecessary because the file already has other exports or imports.
`,
		},
	],
	valid: [
		`export {};`,
		`const value = 1; export {};`,
		`function getValue() {} export {};`,
		`export {};
const value = 1;`,
		`
// No imports or exports, just an empty export to make this a module
export {};
`,
	],
});
