import { ruleTester } from "./ruleTester.ts";
import rule from "./tripleSlashReferenceValidity.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1;
/// <reference foo="bar" />
`,
			snapshot: `
const value = 1;
/// <reference foo="bar" />
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Invalid triple-slash reference directive format.
`,
		},
	],
	valid: [
		{
			code: `
/// <reference types="node" />
const value = 1;
`,
			files: {
				"node_modules/@types/node/index.d.ts": `
`,
			},
		},
		{
			code: `
/// <reference path="./types.d.ts" />
const value = 1;
`,
			files: {
				"types.d.ts": `
`,
			},
		},
		`
/// <reference lib="es2020" />
const value = 1;
`,
		`
/// <reference no-default-lib="true" />
/// <reference lib="es2020" />
const value = 1;
`,
		`
// Regular comment`,
		`const value = 1;
`,
	],
});
