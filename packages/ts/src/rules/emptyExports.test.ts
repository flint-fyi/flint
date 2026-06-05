import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./emptyExports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export const value = {};
export {};
`,
			output: `
export const value = {};

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
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
			output: `
export * from 'module';

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
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
			output: `

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
			output: `
const value = {};
export default value;

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
			output: `

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
			output: `
const value = {};
export { value };

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
			files: {
				...createRuleTesterTSConfig({
					module: "commonjs",
					moduleResolution: "node",
				}),
				"types.d.ts": `
declare module 'module' {
    const value: unknown;
    export = value;
}
`,
			},
			output: `
import value = require('module');

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
			files: {
				...createRuleTesterTSConfig({
					module: "commonjs",
					moduleResolution: "node",
				}),
				"types.d.ts": `
declare module 'module' {
    const value: unknown;
    export = value;
}
`,
			},
			output: `
import value = require('module');


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
void value;
export {};
`,
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
			output: `
import { value } from 'module';
void value;

`,
			snapshot: `
import { value } from 'module';
void value;
export {};
~~~~~~~~~~
Empty export does nothing and can be removed.
`,
		},
		{
			code: `
import * as ns from 'module';
void ns;
export {};
`,
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
			output: `
import * as ns from 'module';
void ns;

`,
			snapshot: `
import * as ns from 'module';
void ns;
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
			files: {
				...createRuleTesterTSConfig({
					module: "commonjs",
					moduleResolution: "node",
				}),
				"types.d.ts": `
declare module 'module' {
    const value: unknown;
    export = value;
}
`,
			},
			output: `
export = {};

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
		{ code: `declare module 'module' {}`, fileName: "file.d.ts" },
		{
			code: `import {} from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
		},
		{
			code: `import * as ns from 'module'; void ns;`,
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
		},
		{
			code: `export = {};`,
			files: {
				...createRuleTesterTSConfig({
					module: "commonjs",
					moduleResolution: "node",
				}),
				"types.d.ts": `
declare module 'module' {
    const value: unknown;
    export = value;
}
`,
			},
		},
		{
			code: `export = 3;`,
			files: {
				...createRuleTesterTSConfig({
					module: "commonjs",
					moduleResolution: "node",
				}),
				"types.d.ts": `
declare module 'module' {
    const value: unknown;
    export = value;
}
`,
			},
		},
		`export const value = {};`,
		`const value = {}; export default value;`,
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
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
		},
		{
			code: `import { A } from 'module'; export {};`,
			fileName: "test.d.ts",
			files: {
				"node_modules/module/index.d.ts": `
export interface A {}
export const value: unknown;
`,
				"node_modules/module/package.json": `{
	"types": "index.d.ts"
}`,
			},
		},
	],
});
