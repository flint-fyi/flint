import rule from "./arrayFilteredFinds.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: number[];
array.filter((value) => value > 0)[0];
`,
			snapshot: `
declare const array: number[];
array.filter((value) => value > 0)[0];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.find()\` over \`.filter()[0]\`.
`,
		},
		{
			code: `
declare const array: number[];
array.filter((value) => value > 0).shift();
`,
			snapshot: `
declare const array: number[];
array.filter((value) => value > 0).shift();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.find()\` over \`.filter()[0]\`.
`,
		},
		{
			code: `
declare const array: number[];
array.filter((value) => value > 0).at(0);
`,
			snapshot: `
declare const array: number[];
array.filter((value) => value > 0).at(0);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.find()\` over \`.filter()[0]\`.
`,
		},
		{
			code: `
declare const array: number[];
array.filter((value) => value > 0).pop();
`,
			snapshot: `
declare const array: number[];
array.filter((value) => value > 0).pop();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.findLast()\` over \`.filter().pop()\` or \`.filter().at(-1)\`.
`,
		},
		{
			code: `
declare const array: number[];
array.filter((value) => value > 0).at(-1);
`,
			snapshot: `
declare const array: number[];
array.filter((value) => value > 0).at(-1);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.findLast()\` over \`.filter().pop()\` or \`.filter().at(-1)\`.
`,
		},
		{
			code: `
declare const array: string[];
array.filter((value) => value.length > 5, thisArg)[0];
`,
			snapshot: `
declare const array: string[];
array.filter((value) => value.length > 5, thisArg)[0];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.find()\` over \`.filter()[0]\`.
`,
		},
		{
			code: `
function process<T extends number[]>(arr: T) {
	return arr.filter((value) => value > 0)[0];
}
`,
			snapshot: `
function process<T extends number[]>(arr: T) {
	return arr.filter((value) => value > 0)[0];
	       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	       Prefer \`.find()\` over \`.filter()[0]\`.
}
`,
		},
	],
	valid: [
		`
declare const array: number[];
array.find((value) => value > 0);
`,
		`
declare const array: number[];
array.findLast((value) => value > 0);
`,
		`
declare const array: number[];
array.filter((value) => value > 0);
`,
		`
declare const array: number[];
array.filter((value) => value > 0)[1];
`,
		`
declare const array: number[];
array.filter((value) => value > 0).length;
`,
		`
declare const array: number[];
array.filter((value) => value > 0).map((v) => v * 2);
`,
		`
declare const array: number[];
const filtered = array.filter((value) => value > 0);
`,
		`
declare const array: number[];
array.filter((value) => value > 0).at(1);
`,
		`
declare const array: number[];
array.filter((value) => value > 0).at(-2);
`,
		`
declare const array: number[];
array.filter()[0];
`,
		`
declare const array: number[];
array.map((value) => value > 0)[0];
`,
		`
declare const array: number[];
array.filter((value) => value > 0, arg1, arg2)[0];
`,
		`
declare const obj: { filter(fn: (x: number) => boolean): number[] };
obj.filter((x) => x > 0)[0];
`,
	],
});
