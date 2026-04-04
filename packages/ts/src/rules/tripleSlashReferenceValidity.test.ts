import { ruleTester } from "./ruleTester.ts";
import rule from "./tripleSlashReferenceValidity.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/// <reference foo="bar" />
const value = 1;
`,
			snapshot: `
/// <reference foo="bar" />
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Invalid triple-slash reference directive format.
const value = 1;
`,
		},
		{
			code: `
/// <reference />
const value = 1;
`,
			snapshot: `
/// <reference />
~~~~~~~~~~~~~~~~~
Invalid triple-slash reference directive format.
const value = 1;
`,
		},
		{
			code: `
/// <reference dom="true" />
const value = 1;
`,
			snapshot: `
/// <reference dom="true" />
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Invalid triple-slash reference directive format.
const value = 1;
`,
		},
		{
			code: `
/// <reference types />
const value = 1;
`,
			snapshot: `
/// <reference types />
~~~~~~~~~~~~~~~~~~~~~~~
Invalid triple-slash reference directive format.
const value = 1;
`,
		},
	],
	valid: [
		`
/// <reference types="node" />
const value = 1;
`,
		`
/// <reference path="./types.d.ts" />
const value = 1;
`,
		`
/// <reference lib="es2020" />
const value = 1;
`,
		`
/// <reference no-default-lib="true" />
const value = 1;
`,
		`
// Regular comment`,
		`const value = 1;
`,
	],
});
