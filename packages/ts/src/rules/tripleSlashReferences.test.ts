import { ruleTester } from "./ruleTester.ts";
import rule from "./tripleSlashReferences.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/// <reference path="./types.d.ts" />
const value = 1;
`,
			files: {
				"types.d.ts": `
export type Foo = string;
`,
			},
			snapshot: `
/// <reference path="./types.d.ts" />
                     ~~~~~~~~~~~~
                     Prefer ECMAScript modules and/or TSConfig settings over legacy triple-slash directives.
const value = 1;
`,
		},
		{
			code: `
/// <reference types="node" />
const process = {};
`,
			files: {
				"node_modules/@types/node/index.d.ts": `
export {};
`,
			},
			snapshot: `
/// <reference types="node" />
                      ~~~~
                      Prefer ECMAScript modules and/or TSConfig settings over legacy triple-slash directives.
const process = {};
`,
		},
		{
			code: `
/// <reference lib="es2020" />
const value = 1;
`,
			snapshot: `
/// <reference lib="es2020" />
                    ~~~~~~
                    Prefer ECMAScript modules and/or TSConfig settings over legacy triple-slash directives.
const value = 1;
`,
		},
	],
	valid: [
		{
			code: `import { foo } from "./foo";`,
			files: {
				"foo.ts": `
export const foo = 1;
`,
			},
		},
		{
			code: `import type { Foo } from "./types";`,
			files: {
				"types.ts": `
export type Foo = string;
`,
			},
		},
		`const value = 1;`,
		`// Regular comment`,
	],
});
