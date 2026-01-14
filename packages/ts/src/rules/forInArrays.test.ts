import rule from "./forInArrays.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: string[];
for (const i in array) {}
`,
			snapshot: `
declare const array: string[];
for (const i in array) {}
~~~~~~~~~~~~~~~~~~~~~~
For-in loops over arrays have surprising behavior that often leads to bugs.
`,
		},
	],
	valid: [
		`
declare const array: string[];
for (const i of array) {}
`,
	],
});
