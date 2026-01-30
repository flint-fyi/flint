import { ruleTester } from "./ruleTester.ts";
import rule from "./tripleSlashReferences.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/// <reference path="./types.d.ts" />
const value = 1;`,
			snapshot: `
/// <reference path="./types.d.ts" />
                     ~~~~~~~~~~~~
                     Triple-slash reference directives are outdated.
const value = 1;`,
		},
		{
			code: `
/// <reference types="node" />
const process = {};`,
			snapshot: `
/// <reference types="node" />
                      ~~~~
                      Triple-slash reference directives are outdated.
const process = {};`,
		},
		{
			code: `
/// <reference lib="es2020" />
const value = 1;`,
			snapshot: `
/// <reference lib="es2020" />
                    ~~~~~~
                    Triple-slash reference directives are outdated.
const value = 1;`,
		},
	],
	valid: [
		`import { foo } from "./foo";`,
		`import type { Foo } from "./types";`,
		`const value = 1;`,
		`// Regular comment`,
	],
});
