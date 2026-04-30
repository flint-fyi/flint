import rule from "./arrayIncludesMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: string[];
array.some((item) => item === "value");
`,
			snapshot: `
declare const array: string[];
array.some((item) => item === "value");
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.includes()\` over \`.some()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: string[];
array.some((item) => "value" === item);
`,
			snapshot: `
declare const array: string[];
array.some((item) => "value" === item);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.includes()\` over \`.some()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: number[];
declare const target: number;
array.some((element) => element === target);
`,
			snapshot: `
declare const array: number[];
declare const target: number;
array.some((element) => element === target);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.includes()\` over \`.some()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: string[];
array.some((item) => item == "value");
`,
			snapshot: `
declare const array: string[];
array.some((item) => item == "value");
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.includes()\` over \`.some()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: string[];
array.some(function (item) { return item === "value"; });
`,
			snapshot: `
declare const array: string[];
array.some(function (item) { return item === "value"; });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.includes()\` over \`.some()\` with a simple equality check.
`,
		},
		{
			code: `
declare const array: string[];
array.some((item) => { return item === "value"; });
`,
			snapshot: `
declare const array: string[];
array.some((item) => { return item === "value"; });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.includes()\` over \`.some()\` with a simple equality check.
`,
		},
		{
			code: `
function check<T extends string[]>(arr: T) {
	return arr.some((item) => item === "value");
}
`,
			snapshot: `
function check<T extends string[]>(arr: T) {
	return arr.some((item) => item === "value");
	       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	       Prefer \`.includes()\` over \`.some()\` with a simple equality check.
}
`,
		},
	],
	valid: [
		`declare const array: string[]; array.includes("value");`,
		`declare const array: string[]; array.some((item) => item.startsWith("v"));`,
		`declare const array: number[]; array.some((item) => item > 0);`,
		`declare const array: string[]; array.some((item, index) => item === "value");`,
		`declare const array: object[]; array.some((item) => item.id === 1);`,
		`declare const array: string[]; array.some((item) => item === item);`,
		`declare const obj: { some(fn: (x: string) => boolean): boolean }; obj.some((x) => x === "value");`,
	],
});
