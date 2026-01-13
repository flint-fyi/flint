import rule from "./arrayFlatMapMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: number[][];
array.map((value) => value).flat();
`,
			snapshot: `
declare const array: number[][];
array.map((value) => value).flat();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flatMap()\` over \`.map().flat()\`.
`,
		},
		{
			code: `
declare const array: number[];
array.map((value) => [value, value * 2]).flat();
`,
			snapshot: `
declare const array: number[];
array.map((value) => [value, value * 2]).flat();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flatMap()\` over \`.map().flat()\`.
`,
		},
		{
			code: `
declare const array: string[];
array.map((value) => value.split(",")).flat();
`,
			snapshot: `
declare const array: string[];
array.map((value) => value.split(",")).flat();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flatMap()\` over \`.map().flat()\`.
`,
		},
		{
			code: `
declare const array: number[];
array.map((value) => [value]).flat(1);
`,
			snapshot: `
declare const array: number[];
array.map((value) => [value]).flat(1);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flatMap()\` over \`.map().flat()\`.
`,
		},
		{
			code: `
[1, 2, 3].map((value) => [value, value]).flat();
`,
			snapshot: `
[1, 2, 3].map((value) => [value, value]).flat();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flatMap()\` over \`.map().flat()\`.
`,
		},
		{
			code: `
declare const array: number[];
array.map(function (value) { return [value]; }).flat();
`,
			snapshot: `
declare const array: number[];
array.map(function (value) { return [value]; }).flat();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flatMap()\` over \`.map().flat()\`.
`,
		},
		{
			code: `
function process<T extends number[]>(arr: T) {
	return arr.map((value) => [value]).flat();
}
`,
			snapshot: `
function process<T extends number[]>(arr: T) {
	return arr.map((value) => [value]).flat();
	       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	       Prefer \`.flatMap()\` over \`.map().flat()\`.
}
`,
		},
	],
	valid: [
		`declare const array: number[]; array.flatMap((value) => [value, value * 2]);`,
		`declare const array: number[]; array.map((value) => value * 2);`,
		`declare const array: number[]; array.flat();`,
		`declare const array: number[][]; array.flat();`,
		`declare const array: number[]; array.map((value) => [value]).flat(2);`,
		`declare const array: number[]; array.filter((value) => value > 0).flat();`,
		`declare const array: number[]; array.map((value) => value).flat(Infinity);`,
		`declare const obj: { map(fn: (x: number) => number[]): number[][] }; obj.map((x) => [x]).flat();`,
	],
});
