import rule from "./arrayElementDeletions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: number[];
delete array[0];
`,
			snapshot: `
declare const array: number[];
delete array[0];
~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const array: number[];
 array.splice(0, 1);
`,
				},
			],
		},
		{
			code: `
declare const array: string[];
const index = 2;
delete array[index];
`,
			snapshot: `
declare const array: string[];
const index = 2;
delete array[index];
~~~~~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const array: string[];
const index = 2;
 array.splice(index, 1);
`,
				},
			],
		},
		{
			code: `
const items = [1, 2, 3];
delete items[1];
`,
			snapshot: `
const items = [1, 2, 3];
delete items[1];
~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
const items = [1, 2, 3];
 items.splice(1, 1);
`,
				},
			],
		},
		{
			code: `
declare const matrix: number[][];
delete matrix[0][1];
`,
			snapshot: `
declare const matrix: number[][];
delete matrix[0][1];
~~~~~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const matrix: number[][];
 matrix[0].splice(1, 1);
`,
				},
			],
		},
		{
			code: `
declare function getArray(): number[];
delete getArray()[0];
`,
			snapshot: `
declare function getArray(): number[];
delete getArray()[0];
~~~~~~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare function getArray(): number[];
 getArray().splice(0, 1);
`,
				},
			],
		},
		{
			code: `
declare const arr: Array<number>;
delete arr[0];
`,
			snapshot: `
declare const arr: Array<number>;
delete arr[0];
~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: Array<number>;
 arr.splice(0, 1);
`,
				},
			],
		},
		{
			code: `
declare const tuple: [number, string];
delete tuple[0];
`,
			snapshot: `
declare const tuple: [number, string];
delete tuple[0];
~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const tuple: [number, string];
 tuple.splice(0, 1);
`,
				},
			],
		},
		{
			code: `
declare const arr: number[] | string[];
delete arr[0];
`,
			snapshot: `
declare const arr: number[] | string[];
delete arr[0];
~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: number[] | string[];
 arr.splice(0, 1);
`,
				},
			],
		},
		{
			code: `
function deleteFromArray<T extends number[]>(a: T) {
	delete a[0];
}
`,
			snapshot: `
function deleteFromArray<T extends number[]>(a: T) {
	delete a[0];
	~~~~~~~~~~~
	Avoid using the \`delete\` operator on arrays.
}
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
function deleteFromArray<T extends number[]>(a: T) {
	 a.splice(0, 1);
}
`,
				},
			],
		},
		{
			code: `
declare const arr: readonly number[];
delete arr[0];
`,
			snapshot: `
declare const arr: readonly number[];
delete arr[0];
~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: readonly number[];
 arr.splice(0, 1);
`,
				},
			],
		},
		{
			code: `
declare const arr: number[];
delete arr[/* index */ 0];
`,
			snapshot: `
declare const arr: number[];
delete arr[/* index */ 0];
~~~~~~~~~~~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: number[];
 arr.splice(/* index */ 0, 1);
`,
				},
			],
		},
		{
			code: `
declare const arr: number[];
delete arr[0 /* trailing */];
`,
			snapshot: `
declare const arr: number[];
delete arr[0 /* trailing */];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: number[];
 arr.splice(0 /* trailing */, 1);
`,
				},
			],
		},
		{
			code: `
declare const arr: number[];
// line comment before
delete arr[0];
`,
			snapshot: `
declare const arr: number[];
// line comment before
delete arr[0];
~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: number[];
// line comment before
 arr.splice(0, 1);
`,
				},
			],
		},
		{
			code: `
declare const arr: number[];
delete /* comment */ arr[0];
`,
			snapshot: `
declare const arr: number[];
delete /* comment */ arr[0];
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: number[];
 /* comment */ arr.splice(0, 1);
`,
				},
			],
		},
		{
			code: `
declare const arr: number[];
delete arr /* target comment */ [0];
`,
			snapshot: `
declare const arr: number[];
delete arr /* target comment */ [0];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Avoid using the \`delete\` operator on arrays.
`,
			suggestions: [
				{
					id: "useSplice",
					updated: `
declare const arr: number[];
 arr /* target comment */ .splice(0, 1);
`,
				},
			],
		},
	],
	valid: [
		`
declare const obj: { [key: string]: number };
delete obj["key"];
`,
		`
declare const obj: Record<string, number>;
delete obj.property;
`,
		`
declare const map: Map<string, number>;
map.delete("key");
`,
		`
declare const array: number[];
 array.splice(0, 1);
`,
		`
delete globalThis.myProperty;
`,
		`
declare const maybeArray: unknown;
delete maybeArray[0];
`,
		`
declare const maybeArray: any;
delete maybeArray[0];
`,
		`
declare const obj: { a: number };
delete obj.a;
`,
	],
});
