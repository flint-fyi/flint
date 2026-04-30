import rule from "./arrayLoops.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: number[];
array.forEach((element) => { console.log(element); });
`,
			snapshot: `
declare const array: number[];
array.forEach((element) => { console.log(element); });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer a more direct for-of loop over \`.forEach()\`.
`,
		},
		{
			code: `
declare const array: string[];
array.forEach(function (item) { process(item); });
`,
			snapshot: `
declare const array: string[];
array.forEach(function (item) { process(item); });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer a more direct for-of loop over \`.forEach()\`.
`,
		},
		{
			code: `
[1, 2, 3].forEach((value) => { handle(value); });
`,
			snapshot: `
[1, 2, 3].forEach((value) => { handle(value); });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer a more direct for-of loop over \`.forEach()\`.
`,
		},
		{
			code: `
declare const array: number[];
array.forEach((element, index) => { console.log(index, element); });
`,
			snapshot: `
declare const array: number[];
array.forEach((element, index) => { console.log(index, element); });
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer a more direct for-of loop over \`.forEach()\`.
`,
		},
		{
			code: `
function process<T extends number[]>(arr: T) {
	arr.forEach((element) => { console.log(element); });
}
`,
			snapshot: `
function process<T extends number[]>(arr: T) {
	arr.forEach((element) => { console.log(element); });
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	Prefer a more direct for-of loop over \`.forEach()\`.
}
`,
		},
	],
	valid: [
		`declare const array: number[]; for (const element of array) { console.log(element); }`,
		`declare const array: number[]; array.map((element) => element * 2);`,
		`declare const array: number[]; array.filter((element) => element > 0);`,
		`declare const set: Set<number>; set.forEach((value) => console.log(value));`,
		`declare const map: Map<string, number>; map.forEach((value, key) => console.log(key, value));`,
	],
});
