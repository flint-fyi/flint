import rule from "./arrayIndexOfMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: string[];
array.findIndex((item) => item === "value");
`,
			snapshot: `
declare const array: string[];
array.findIndex((item) => item === "value");
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.indexOf()\` over \`.findIndex()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: string[];
array.findIndex((item) => "value" === item);
`,
			snapshot: `
declare const array: string[];
array.findIndex((item) => "value" === item);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.indexOf()\` over \`.findIndex()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: number[];
declare const target: number;
array.findIndex((element) => element === target);
`,
			snapshot: `
declare const array: number[];
declare const target: number;
array.findIndex((element) => element === target);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.indexOf()\` over \`.findIndex()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: string[];
array.findIndex(function (item) { return item === "value"; });
`,
			snapshot: `
declare const array: string[];
array.findIndex(function (item) { return item === "value"; });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.indexOf()\` over \`.findIndex()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: string[];
array.findLastIndex((item) => item === "value");
`,
			snapshot: `
declare const array: string[];
array.findLastIndex((item) => item === "value");
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.lastIndexOf()\` over \`.findLastIndex()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: number[];
declare const target: number;
array.findLastIndex((element) => element === target);
`,
			snapshot: `
declare const array: number[];
declare const target: number;
array.findLastIndex((element) => element === target);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.lastIndexOf()\` over \`.findLastIndex()\` with a simple equality check.
`,
		},
		{
			code: `
function find<T extends string[]>(arr: T) {
	return arr.findIndex((item) => item === "value");
}
`,
			snapshot: `
function find<T extends string[]>(arr: T) {
	return arr.findIndex((item) => item === "value");
	       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	       Prefer \`.indexOf()\` over \`.findIndex()\` with a simple equality check.
}
`,
		},
	],
	valid: [
		`declare const array: string[]; array.indexOf("value");`,
		`declare const array: string[]; array.lastIndexOf("value");`,
		`declare const array: string[]; array.findIndex((item) => item.startsWith("v"));`,
		`declare const array: number[]; array.findIndex((item) => item > 0);`,
		`declare const array: string[]; array.findIndex((item, index) => item === "value");`,
		`declare const array: object[]; array.findIndex((item) => item.id === 1);`,
		`declare const array: string[]; array.findIndex((item) => item == "value");`,
		`declare const obj: { findIndex(fn: (x: string) => boolean): number }; obj.findIndex((x) => x === "value");`,
	],
});
