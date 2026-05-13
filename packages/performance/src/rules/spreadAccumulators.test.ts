import { ruleTester } from "./ruleTester.ts";
import rule from "./spreadAccumulators.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let array = [];
for (const item of items) {
    array = [...array, item];
}
`,
			snapshot: `
let array = [];
for (const item of items) {
    array = [...array, item];
             ~~~
             Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
let result = [];
for (let i = 0; i < items.length; i++) {
    result = [...result, items[i]];
}
`,
			snapshot: `
let result = [];
for (let i = 0; i < items.length; i++) {
    result = [...result, items[i]];
              ~~~
              Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
let object = {};
for (const key of keys) {
    object = { ...object, [key]: value };
}
`,
			snapshot: `
let object = {};
for (const key of keys) {
    object = { ...object, [key]: value };
               ~~~
               Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
let data = {};
for (const entry of entries) {
    data = { ...data, property: entry };
}
`,
			snapshot: `
let data = {};
for (const entry of entries) {
    data = { ...data, property: entry };
             ~~~
             Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
let numbers = [];
let i = 0;
while (i < 10) {
    numbers = [...numbers, i];
    i++;
}
`,
			snapshot: `
let numbers = [];
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
let items = [];
let i = 0;
do {
    items = [...items, i];
    i++;
} while (i < 5);
`,
			snapshot: `
let items = [];
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
let collection = [];
for (const value in values) {
    collection = [...collection, values[value]];
}
`,
			snapshot: `
let collection = [];
for (const value in values) {
    collection = [...collection, values[value]];
                  ~~~
                  Using spread operations to accumulate values in loops causes quadratic time complexity.
}
`,
		},
		{
			code: `
let accumulated = [];
for (let i = 0; i < 10; i++) {
    if (condition) {
        accumulated = [...accumulated, i];
    }
}
`,
			snapshot: `
let accumulated = [];
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
let array = [];
for (const item of items) {
    array.push(item);
}
`,
		`
let result = [];
for (let i = 0; i < items.length; i++) {
    result.push(items[i]);
}
`,
		`
let object = {};
for (const key of keys) {
    object[key] = value;
}
`,
		`
let data = {};
for (const entry of entries) {
    Object.assign(data, entry);
}
`,
		`
const array = items.map(item => item);
`,
		`
let accumulated = [];
for (let i = 0; i < 10; i++) {
    const temp = [...accumulated, i];
}
`,
		`
let result = [];
for (let i = 0; i < 10; i++) {
    const newArray = [...someOtherArray, i];
    result.push(newArray);
}
`,
		`
const combined = [...array1, ...array2];
`,
		`
function example() {
    let inner = [];
    for (const item of items) {
        const fn = () => {
            inner = [...inner, item];
        };
    }
}
`,
	],
});
