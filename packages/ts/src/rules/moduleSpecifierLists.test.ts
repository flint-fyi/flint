import rule from "./moduleSpecifierLists.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import {} from 'module';
`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
			snapshot: `
import {} from 'module';
       ~~
       Import statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
				{
					id: "convertToSideEffectImport",
					updated: `
import 'module';
`,
				},
			],
		},
		{
			code: `
import defaultExport, {} from 'module';
`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
			snapshot: `
import defaultExport, {} from 'module';
                      ~~
                      Import statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeEmptyBraces",
					updated: `
import defaultExport from 'module';
`,
				},
			],
		},
		{
			code: `
import type {} from 'module';
`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
			snapshot: `
import type {} from 'module';
            ~~
            Import statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
			],
		},
		{
			code: `
export {} from 'module';
`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
			snapshot: `
export {} from 'module';
~~~~~~~~~~~~~~~~~~~~~~~~
Export statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
				{
					id: "convertToSideEffectImport",
					updated: `
import 'module';
`,
				},
			],
		},
		{
			code: `
export type {} from 'module';
`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
			snapshot: `
export type {} from 'module';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Export statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
				{
					id: "convertToSideEffectImport",
					updated: `
import 'module';
`,
				},
			],
		},
	],
	valid: [
		{
			code: `import { something } from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `import defaultExport from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `import * as namespace from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `import 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `import defaultExport, { named } from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `import defaultExport, * as namespace from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `export { something } from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `export * from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		`const local = 1; export { local };`,
		`const value = 1; export default value;`,
		{
			code: `import type { Type } from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
		{
			code: `export type { Type } from 'module';`,
			files: {
				"node_modules/module/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const named: unknown;
export const something: unknown;
export type Type = unknown;
`,
			},
		},
	],
});
