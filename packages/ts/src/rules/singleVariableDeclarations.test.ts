import { ruleTester } from "./ruleTester.ts";
import rule from "./singleVariableDeclarations.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let first, second, third;
`,
			snapshot: `
let first, second, third;
~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
const width = 100, height = 200;
`,
			snapshot: `
const width = 100, height = 200;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
var name = 'Alice', age = 30;
`,
			snapshot: `
var name = 'Alice', age = 30;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
declare const console: { log(value: number): void };

for (let index = 0, length = 10; index < length; index++) {
    console.log(index);
}
`,
			snapshot: `
declare const console: { log(value: number): void };

for (let index = 0, length = 10; index < length; index++) {
     ~~~~~~~~~~~~~~~~~~~~~~~~~~
     Split this into separate variable declarations.
    console.log(index);
}
`,
		},
		{
			code: `
let initialized = 1, uninitialized;
`,
			snapshot: `
let initialized = 1, uninitialized;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
declare function getA(): Disposable;
declare function getB(): Disposable;

using a = getA(), b = getB();
`,
			snapshot: `
declare function getA(): Disposable;
declare function getB(): Disposable;

using a = getA(), b = getB();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
declare function getA(): AsyncDisposable;
declare function getB(): AsyncDisposable;

async function disposeResources() {
    await using a = getA(), b = getB();
}
`,
			snapshot: `
declare function getA(): AsyncDisposable;
declare function getB(): AsyncDisposable;

async function disposeResources() {
    await using a = getA(), b = getB();
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Split this into separate variable declarations.
}
`,
		},
	],
	valid: [
		`let first;`,
		`let first;
let second;
let third;`,
		`const width = 100;
const height = 200;`,
		`var name = 'Alice';
var age = 30;`,
		`
declare const object: { first: number; second: number };

const { first, second } = object;`,
		`
declare const array: [number, number];

const [first, second] = array;`,
		`
declare const object: { first: number; second: number; third: number };

const { first, second, third } = object;`,
		`
declare const array: [number, number, number];

const [first, second, third] = array;`,
		`
declare const obj: { a: number; b: number };

let { a, b } = obj;`,
		`
declare const arr: [number, number, number];

let [x, y, z] = arr;`,
		`
declare const obj: { foo: number; bar: number };

var { foo, bar } = obj;`,
		`
declare const arr: [number, number];

var [one, two] = arr;`,
		`
declare const obj: { a: { b: number; c: number } };

const { a: { b, c } } = obj;`,
		`
declare const arr: [number, [number, number]];

const [a, [b, c]] = arr;`,
		`
declare const obj: { a?: number; b?: number };

const { a = 1, b = 2 } = obj;`,
		`
declare const arr: [number?, number?];

const [a = 1, b = 2] = arr;`,
		`
declare const items: string[];
declare const console: { log(value: string): void };

for (const item of items) {
    console.log(item);
}`,
		`
declare const object: { key: string };
declare const console: { log(value: string): void };

for (const key in object) {
    console.log(key);
}`,
		`
declare const console: { log(value: number): void };

for (let index = 0; index < 10; index++) {
    console.log(index);
}`,
		`
declare const entries: [string, string][];

for (const [key, value] of entries) {}`,
		`
declare const people: { name: string; age: number }[];

for (const { name, age } of people) {}`,
		`
declare const object: { key: string };

for (const key in object) {}`,
		`
declare function getResource(): Disposable;

using resource = getResource();`,
		`
declare function getA(): Disposable;
declare function getB(): Disposable;

using a = getA();
using b = getB();
`,
		`
declare function getConnection(): AsyncDisposable;

async function connect() {
    await using connection = getConnection();
}`,
		`
declare function getA(): AsyncDisposable;
declare function getB(): AsyncDisposable;

async function disposeResources() {
    await using a = getA();
    await using b = getB();
}
`,
	],
});
