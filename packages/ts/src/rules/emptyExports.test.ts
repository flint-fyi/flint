import rule from "./emptyExports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export const value = {};
export {};
`,
			snapshot: `
export const value = {};
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
export * from 'module';
export {};
`,
			snapshot: `
export * from 'module';
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
export {};
export * from 'module';
`,
			snapshot: `
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
export * from 'module';
`,
		},
		{
			code: `
const value = {};
export default value;
export {};
`,
			snapshot: `
const value = {};
export default value;
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
export {};
const value = {};
export default value;
`,
			snapshot: `
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
const value = {};
export default value;
`,
		},
		{
			code: `
const value = {};
export { value };
export {};
`,
			snapshot: `
const value = {};
export { value };
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
import value = require('module');
export {};
`,
			snapshot: `
import value = require('module');
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
import value = require('module');
export {};
export {};
`,
			snapshot: `
import value = require('module');
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
import { value } from 'module';
export {};
`,
			snapshot: `
import { value } from 'module';
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
import * as ns from 'module';
export {};
`,
			snapshot: `
import * as ns from 'module';
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
export = {};
export {};
`,
			snapshot: `
export = {};
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
	],
	valid: [
		`declare module 'module'`,
		`import {} from 'module';`,
		`import * as ns from 'module';`,
		`export = {};`,
		`export = 3;`,
		`export const value = {};`,
		`const value = {}; export default value;`,
		`export * from 'module'; export = {};`,
		`export {};`,
		{
			code: `export type A = 1; export {};`,
			fileName: "test.d.ts",
		},
		{
			code: `export declare const value = 2; export {};`,
			fileName: "test.d.ts",
		},
		{
			code: `import type { A } from 'module'; export {};`,
			fileName: "test.d.ts",
		},
		{
			code: `import { A } from 'module'; export {};`,
			fileName: "test.d.ts",
		},
	],
});
