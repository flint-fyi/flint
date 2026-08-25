import rule from "./importEmptyBlocks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { } from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "mod";
`,
			snapshot: `
import { } from "mod";
       ~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import {  } from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "mod";
`,
			snapshot: `
import {  } from "mod";
       ~~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import {} from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "mod";
`,
			snapshot: `
import {} from "mod";
       ~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default, { } from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, { } from "mod";
                ~~~
                Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default, {} from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, {} from "mod";
                ~~
                Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default, {  } from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, {  } from "mod";
                ~~~~
                Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type { } from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "mod";
`,
			snapshot: `
import type { } from "mod";
            ~~~
            Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type {} from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "mod";
`,
			snapshot: `
import type {} from "mod";
            ~~
            Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import { } from "@scope/package";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "@scope/package";
`,
			snapshot: `
import { } from "@scope/package";
       ~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import { } from "./relative-path";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "./relative-path";
`,
			snapshot: `
import { } from "./relative-path";
       ~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import {
} from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import "mod";
`,
			snapshot: `
import {
       ~
       Empty named import blocks are unnecessary.
} from "mod";
~
`,
		},
		{
			code: `
import Default, {
} from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, {
                ~
                Empty named import blocks are unnecessary.
} from "mod";
~
`,
		},
		{
			code: `
import Default /* hello, world */ , { } from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import Default /* hello, world */  from "mod";
`,
			snapshot: `
import Default /* hello, world */ , { } from "mod";
                                    ~~~
                                    Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default /* a, b, c */ , {} from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import Default /* a, b, c */  from "mod";
`,
			snapshot: `
import Default /* a, b, c */ , {} from "mod";
                               ~~
                               Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default /* , */ , { } from "mod";
`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
			output: `
import Default /* , */  from "mod";
`,
			snapshot: `
import Default /* , */ , { } from "mod";
                         ~~~
                         Empty named import blocks are unnecessary.
`,
		},
	],
	valid: [
		{
			code: `import { named } from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import Default, { named } from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import Default from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import * as mod from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import type { Type } from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import type Default from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import type * as Types from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import { a, b, c } from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import Default, { a, b } from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
		{
			code: `import type { TypeA, TypeB } from "mod";`,
			files: {
				"node_modules/@scope/package/index.d.ts": `
export {};
`,
				"node_modules/mod/index.d.ts": `
declare const Default: unknown;

export default Default;
export const a: unknown;
export const b: unknown;
export const c: unknown;
export const named: unknown;
export type Type = unknown;
export type TypeA = unknown;
export type TypeB = unknown;
`,
				"relative-path.ts": `
export {};
`,
			},
		},
	],
});
