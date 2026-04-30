import rule from "./arrayFlatMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: number[][];
array.flatMap((value) => value);
`,
			snapshot: `
declare const array: number[][];
array.flatMap((value) => value);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flat()\` over legacy array flattening techniques.
`,
		},
		{
			code: `
declare const array: number[][];
[].concat(...array);
`,
			snapshot: `
declare const array: number[][];
[].concat(...array);
~~~~~~~~~~~~~~~~~~~
Prefer \`.flat()\` over legacy array flattening techniques.
`,
		},
		{
			code: `
declare const array: number[][];
[].concat.apply([], array);
`,
			snapshot: `
declare const array: number[][];
[].concat.apply([], array);
~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flat()\` over legacy array flattening techniques.
`,
		},
		{
			code: `
declare const array: number[][];
Array.prototype.concat.apply([], array);
`,
			snapshot: `
declare const array: number[][];
Array.prototype.concat.apply([], array);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flat()\` over legacy array flattening techniques.
`,
		},
		{
			code: `
declare const array: number[][];
Array.prototype.concat.call([], ...array);
`,
			snapshot: `
declare const array: number[][];
Array.prototype.concat.call([], ...array);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flat()\` over legacy array flattening techniques.
`,
		},
		{
			code: `
function process<T extends number[][]>(arr: T) {
	return arr.flatMap((value) => value);
}
`,
			snapshot: `
function process<T extends number[][]>(arr: T) {
	return arr.flatMap((value) => value);
	       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	       Prefer \`.flat()\` over legacy array flattening techniques.
}
`,
		},
		{
			code: `
declare const array: number[][];
array.flatMap(((value) => value));
`,
			snapshot: `
declare const array: number[][];
array.flatMap(((value) => value));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flat()\` over legacy array flattening techniques.
`,
		},
		{
			code: `
declare const array: number[][];
array.flatMap((((value) => value)));
`,
			snapshot: `
declare const array: number[][];
array.flatMap((((value) => value)));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`.flat()\` over legacy array flattening techniques.
`,
		},
		{
			code: `
function process<T extends number[][]>(arr: T) {
	return [].concat(...arr);
}
`,
			snapshot: `
function process<T extends number[][]>(arr: T) {
	return [].concat(...arr);
	       ~~~~~~~~~~~~~~~~~
	       Prefer \`.flat()\` over legacy array flattening techniques.
}
`,
		},
		{
			code: `
function process<T extends number[][]>(arr: T) {
	return [].concat.apply([], arr);
}
`,
			snapshot: `
function process<T extends number[][]>(arr: T) {
	return [].concat.apply([], arr);
	       ~~~~~~~~~~~~~~~~~~~~~~~~
	       Prefer \`.flat()\` over legacy array flattening techniques.
}
`,
		},
		{
			code: `
function process<T extends number[][]>(arr: T) {
	return Array.prototype.concat.call([], ...arr);
}
`,
			snapshot: `
function process<T extends number[][]>(arr: T) {
	return Array.prototype.concat.call([], ...arr);
	       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	       Prefer \`.flat()\` over legacy array flattening techniques.
}
`,
		},
	],
	valid: [
		`declare const array: number[][]; array.flat();`,
		`declare const array: number[][]; array.flatMap((value) => value.map((n) => n * 2));`,
		`declare const array: number[]; array.flatMap((value) => [value, value * 2]);`,
		`declare const array: number[]; [].concat(array);`,
		`declare const array: number[][]; [1, 2].concat(...array);`,
		`declare const array: number[]; custom.flatten(array);`,
		`declare const array: number[][]; Array.prototype.concat.apply([1], array);`,
		`declare const array: number[][]; Array.prototype.concat.call([1], ...array);`,
		`declare const obj: { flatMap(fn: (x: number) => number): number[] }; obj.flatMap((x) => x);`,
		`declare const notArray: { concat: { apply: (a: any[], b: any) => any } }; [].concat.apply([], notArray);`,
		`declare const notArray: string; [].concat(...notArray);`,
		`declare const notArray: { [Symbol.iterator]: () => Iterator<number> }; Array.prototype.concat.call([], ...notArray);`,
	],
});
