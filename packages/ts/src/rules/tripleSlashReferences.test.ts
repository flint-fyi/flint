import { ruleTester } from "./ruleTester.ts";
import rule from "./tripleSlashReferences.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/// <reference path="./types.d.ts" />
const value = 1;
`,
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
		`import { foo } from "./foo";`,
		`import type { Foo } from "./types";`,
		`const value = 1;`,
		`// Regular comment`,
	],
});
