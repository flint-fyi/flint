import rule from "./importTypeSideEffects.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { type A } from "mod";
`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
			snapshot: `
import { type A } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Every specifier in this import is a type, so a single top-level \`import type\` would be cleaner.
`,
		},
		{
			code: `
import { type A, type B } from "mod";
`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
			snapshot: `
import { type A, type B } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Every specifier in this import is a type, so a single top-level \`import type\` would be cleaner.
`,
		},
		{
			code: `
import { type A, type B, type C } from "mod";
`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
			snapshot: `
import { type A, type B, type C } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Every specifier in this import is a type, so a single top-level \`import type\` would be cleaner.
`,
		},
	],
	valid: [
		// Top-level type import is correct
		{
			code: `import type { A, B } from "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
		// Mixed type and value imports are allowed
		{
			code: `import { type A, value } from "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
		{
			code: `import { value, type B } from "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
		// Value-only imports
		{
			code: `import { value } from "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
		{
			code: `import { a, b } from "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
		// Default import with inline types is allowed
		{
			code: `import Default, { type A } from "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
		// Side-effect imports
		{
			code: `import "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
		// Namespace imports
		{
			code: `import * as mod from "mod";`,
			files: {
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const value: unknown;
export type A = unknown;
export type B = unknown;
export type C = unknown;
`,
			},
		},
	],
});
