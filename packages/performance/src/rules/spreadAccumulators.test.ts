import { ruleTester } from "./ruleTester.ts";
import rule from "./spreadAccumulators.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const items: number[];
let array: number[] = [];
for (const item of items) {
    array = [...array, item];
}
`,
			snapshot: `
declare const items: number[];
let array: number[] = [];
for (const item of items) {
    array = [...array, item];
             ~~~
             Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
declare const items: number[];
let result: number[] = [];
for (let i = 0; i < items.length; i++) {
    result = [...result, items[i]];
}
`,
			snapshot: `
declare const items: number[];
let result: number[] = [];
for (let i = 0; i < items.length; i++) {
    result = [...result, items[i]];
              ~~~
              Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
declare const keys: string[];
declare const value: number;
let object: Record<string, unknown> = {};
for (const key of keys) {
    object = { ...object, [key]: value };
}
`,
			snapshot: `
declare const keys: string[];
declare const value: number;
let object: Record<string, unknown> = {};
for (const key of keys) {
    object = { ...object, [key]: value };
               ~~~
               Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
declare const entries: number[];
let data: Record<string, unknown> = {};
for (const entry of entries) {
    data = { ...data, property: entry };
}
`,
			snapshot: `
declare const entries: number[];
let data: Record<string, unknown> = {};
for (const entry of entries) {
    data = { ...data, property: entry };
             ~~~
             Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
let numbers: number[] = [];
let i = 0;
while (i < 10) {
    numbers = [...numbers, i];
    i++;
}
`,
			snapshot: `
let numbers: number[] = [];
let i = 0;
while (i < 10) {
    numbers = [...numbers, i];
               ~~~
               Using spread operations to accumulate values in loops causes quadratic time complexity.
    i++;
}
`,
		},
		{
			code: `
let items: number[] = [];
let i = 0;
do {
    items = [...items, i];
    i++;
} while (i < 5);
`,
			snapshot: `
let items: number[] = [];
let i = 0;
do {
    items = [...items, i];
             ~~~
             Using spread operations to accumulate values in loops causes quadratic time complexity.
    i++;
} while (i < 5);
`,
		},
		{
			code: `
declare const values: Record<string, number>;
let collection: number[] = [];
for (const value in values) {
    collection = [...collection, values[value]];
}
`,
			snapshot: `
declare const values: Record<string, number>;
let collection: number[] = [];
for (const value in values) {
    collection = [...collection, values[value]];
                  ~~~
                  Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
declare const condition: boolean;
let accumulated: number[] = [];
for (let i = 0; i < 10; i++) {
    if (condition) {
        accumulated = [...accumulated, i];
    }
}
`,
			snapshot: `
declare const condition: boolean;
let accumulated: number[] = [];
for (let i = 0; i < 10; i++) {
    if (condition) {
        accumulated = [...accumulated, i];
                       ~~~
                       Using spread operations to accumulate values in loops causes quadratic time complexity.
    }
}
`,
		},
	],
	valid: [
		`
declare const items: number[];
let array: number[] = [];
for (const item of items) {
    array.push(item);
}
`,
		`
declare const items: number[];
let result: number[] = [];
for (let i = 0; i < items.length; i++) {
    result.push(items[i]);
}
`,
		`
declare const keys: string[];
declare const value: number;
let object: Record<string, unknown> = {};
for (const key of keys) {
    object[key] = value;
}
`,
		`
declare const entries: number[];
let data: Record<string, unknown> = {};
for (const entry of entries) {
    Object.assign(data, entry);
}
`,
		`
declare const items: number[];
const array = items.map(item => item);
`,
		`
let accumulated: number[] = [];
for (let i = 0; i < 10; i++) {
    const temp = [...accumulated, i];
}
`,
		`
declare const someOtherArray: number[];
let result: number[][] = [];
for (let i = 0; i < 10; i++) {
    const newArray = [...someOtherArray, i];
    result.push(newArray);
}
`,
		`
declare const array1: number[];
declare const array2: number[];
const combined = [...array1, ...array2];
`,
		`
declare const items: number[];
function example() {
    let inner: number[] = [];
    for (const item of items) {
        const fn = () => {
            inner = [...inner, item];
        };
    }
}
`,
	],
});
