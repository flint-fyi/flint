import rule from "./restrictedImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { dangerous } from "./restricted";
`,
			files: {
				"restricted.ts": `export const dangerous = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							name: "dangerous",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import { dangerous } from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'dangerous' import from './restricted' is restricted.
`,
		},
		{
			code: `
import { dangerous } from "./restricted";
`,
			files: {
				"restricted.ts": `export const dangerous = 42;`,
			},
			options: {
				restrictions: [
					{
						message: "Use safeFn instead.",
						specifier: {
							from: "file",
							name: "dangerous",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import { dangerous } from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'dangerous' import from './restricted' is restricted. Use safeFn instead.
`,
		},
		{
			code: `
import { helper } from "./restricted";
`,
			files: {
				"restricted.ts": `export const helper = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import { helper } from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'helper' import from './restricted' is restricted.
`,
		},
		{
			code: `
import * as ns from "./restricted";
`,
			files: {
				"restricted.ts": `export const helper = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import * as ns from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'./restricted' import is restricted.
`,
		},
		{
			code: `
import * as ns from "./restricted";
`,
			files: {
				"restricted.ts": `export const badExport = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							name: "badExport",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import * as ns from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* import is invalid because 'badExport' from './restricted' is restricted.
`,
		},
		{
			code: `
import { foo } from "./restricted";
`,
			files: {
				"restricted.ts": `export const foo = 42;`,
			},
			options: {
				restrictions: [
					{
						allowTypeImports: true,
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import { foo } from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'foo' import from './restricted' is restricted.
`,
		},
		{
			code: `
import { type A, b } from "./restricted";
`,
			files: {
				"restricted.ts": `export type A = string; export const b = 42;`,
			},
			options: {
				restrictions: [
					{
						allowTypeImports: true,
						specifier: {
							from: "file",
							name: ["A", "b"],
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import { type A, b } from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'b' import from './restricted' is restricted.
`,
		},
		{
			code: `
export { dangerous } from "./restricted";
`,
			files: {
				"restricted.ts": `export const dangerous = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							name: "dangerous",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
export { dangerous } from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'dangerous' import from './restricted' is restricted.
`,
		},
		{
			code: `
export * from "./restricted";
`,
			files: {
				"restricted.ts": `export const helper = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
export * from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'./restricted' import is restricted.
`,
		},
		{
			code: `
export * from "./restricted";
`,
			files: {
				"restricted.ts": `export const badExport = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							name: "badExport",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
export * from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* import is invalid because 'badExport' from './restricted' is restricted.
`,
		},
		{
			code: `
import foo from "./restricted";
`,
			files: {
				"restricted.ts": `const foo = 42; export default foo;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							name: "default",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import foo from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'default' import from './restricted' is restricted.
`,
		},
		{
			code: `
import * as ns from "./restricted";
`,
			files: {
				"restricted.ts": `export const a = 1; export const b = 2;`,
			},
			options: {
				restrictions: [
					{
						message: "Import specific allowed names.",
						specifier: {
							from: "file",
							name: ["a", "b"],
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import * as ns from "./restricted";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* import is invalid because 'a', 'b' from './restricted' is restricted. Import specific allowed names.
`,
		},
		{
			code: `
import "./restricted";
`,
			files: {
				"restricted.ts": `export const x = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
			snapshot: `
import "./restricted";
~~~~~~~~~~~~~~~~~~~~~~
'./restricted' import is restricted.
`,
		},
		{
			code: `
import { restricted } from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const restricted: number; export const allowed: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: "restricted",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
import { restricted } from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'restricted' import from 'test-pkg' is restricted.
`,
		},
		{
			code: `
import { anything } from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const anything: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
import { anything } from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'anything' import from 'test-pkg' is restricted.
`,
		},
		{
			code: `
import * as pkg from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const a: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
import * as pkg from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'test-pkg' import is restricted.
`,
		},
		{
			code: `
import * as pkg from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const badExport: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: "badExport",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
import * as pkg from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* import is invalid because 'badExport' from 'test-pkg' is restricted.
`,
		},
		{
			code: `
import { restricted } from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const restricted: number; }`,
			},
			options: {
				restrictions: [
					{
						message: "Use alternative-pkg instead.",
						specifier: {
							from: "package",
							name: "restricted",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
import { restricted } from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'restricted' import from 'test-pkg' is restricted. Use alternative-pkg instead.
`,
		},
		{
			code: `
export { restricted } from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const restricted: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: "restricted",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
export { restricted } from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'restricted' import from 'test-pkg' is restricted.
`,
		},
		{
			code: `
export * from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const a: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
export * from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~
'test-pkg' import is restricted.
`,
		},
		{
			code: `
import "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const x: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
import "test-pkg";
~~~~~~~~~~~~~~~~~~
'test-pkg' import is restricted.
`,
		},
		{
			code: `
import { restricted } from "test-pkg";
`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const restricted: number; export type MyType = string; }`,
			},
			options: {
				restrictions: [
					{
						allowTypeImports: true,
						specifier: {
							from: "package",
							package: "test-pkg",
						},
					},
				],
			},
			snapshot: `
import { restricted } from "test-pkg";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'restricted' import from 'test-pkg' is restricted.
`,
		},
	],
	valid: [
		{
			code: `import { allowed } from "./allowed";`,
			files: {
				"allowed.ts": `export const allowed = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
		},
		{
			code: `import { safeExport } from "./restricted";`,
			files: {
				"restricted.ts": `export const safeExport = 1; export const badExport = 2;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							name: "badExport",
							path: "./restricted.ts",
						},
					},
				],
			},
		},
		{
			code: `import type { Foo } from "./restricted";`,
			files: {
				"restricted.ts": `export type Foo = string;`,
			},
			options: {
				restrictions: [
					{
						allowTypeImports: true,
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
		},
		{
			code: `import { type Foo } from "./restricted";`,
			files: {
				"restricted.ts": `export type Foo = string; export const bar = 42;`,
			},
			options: {
				restrictions: [
					{
						allowTypeImports: true,
						specifier: {
							from: "file",
							name: "Foo",
							path: "./restricted.ts",
						},
					},
				],
			},
		},
		`import foo from "anything";`,
		{
			code: `const foo = 1; export { foo };`,
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
		},
		{
			code: `export type { Foo } from "./restricted";`,
			files: {
				"restricted.ts": `export type Foo = string;`,
			},
			options: {
				restrictions: [
					{
						allowTypeImports: true,
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
		},
		{
			code: `import "./allowed";`,
			files: {
				"allowed.ts": `export const x = 42;`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "file",
							path: "./restricted.ts",
						},
					},
				],
			},
		},
		{
			code: `import { something } from "other-pkg";`,
			files: {
				"other-pkg.d.ts": `declare module "other-pkg" { export const something: number; }`,
				"test-pkg.d.ts": `declare module "test-pkg" { export const x: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							package: "test-pkg",
						},
					},
				],
			},
		},
		{
			code: `import { allowed } from "test-pkg";`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const allowed: number; export const restricted: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: "restricted",
							package: "test-pkg",
						},
					},
				],
			},
		},
		{
			code: `import type { MyType } from "test-pkg";`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export type MyType = string; }`,
			},
			options: {
				restrictions: [
					{
						allowTypeImports: true,
						specifier: {
							from: "package",
							package: "test-pkg",
						},
					},
				],
			},
		},
		{
			code: `import "test-pkg";`,
			files: {
				"test-pkg.d.ts": `declare module "test-pkg" { export const restricted: number; }`,
			},
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							name: "restricted",
							package: "test-pkg",
						},
					},
				],
			},
		},
		{
			code: `import "nonexistent-module";`,
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							package: "nonexistent-module",
						},
					},
				],
			},
		},
		{
			code: `import * as ns from "nonexistent-module";`,
			options: {
				restrictions: [
					{
						specifier: {
							from: "package",
							package: "nonexistent-module",
						},
					},
				],
			},
		},
	],
});
