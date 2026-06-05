import rule from "./functionApplySpreads.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function example(...args: number[]) { return args; }
const args = [1, 2, 3];
example.apply(undefined, args);
`,
			output: `
function example(...args: number[]) { return args; }
const args = [1, 2, 3];
example(...args);
`,
			snapshot: `
function example(...args: number[]) { return args; }
const args = [1, 2, 3];
example.apply(undefined, args);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
function example(...args: number[]) { return args; }
const args = [1, 2, 3];
example.apply(null, args);
`,
			output: `
function example(...args: number[]) { return args; }
const args = [1, 2, 3];
example(...args);
`,
			snapshot: `
function example(...args: number[]) { return args; }
const args = [1, 2, 3];
example.apply(null, args);
~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const obj = {
    example(...args: number[]) { return args; }
};
const args = [1, 2, 3];
obj.example.apply(obj, args);
`,
			output: `
const obj = {
    example(...args: number[]) { return args; }
};
const args = [1, 2, 3];
obj.example(...args);
`,
			snapshot: `
const obj = {
    example(...args: number[]) { return args; }
};
const args = [1, 2, 3];
obj.example.apply(obj, args);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const a = {
    b: {
        c(...args: number[]) { return args; }
    }
};
const args = [1, 2, 3];
a.b.c.apply(a.b, args);
`,
			output: `
const a = {
    b: {
        c(...args: number[]) { return args; }
    }
};
const args = [1, 2, 3];
a.b.c(...args);
`,
			snapshot: `
const a = {
    b: {
        c(...args: number[]) { return args; }
    }
};
const args = [1, 2, 3];
a.b.c.apply(a.b, args);
~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const numbers = [1, 2, 3];
Math.max.apply(Math, numbers);
`,
			output: `
const numbers = [1, 2, 3];
Math.max(...numbers);
`,
			snapshot: `
const numbers = [1, 2, 3];
Math.max.apply(Math, numbers);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const values = [1, 2, 3];
Math.min.apply(Math, values);
`,
			output: `
const values = [1, 2, 3];
Math.min(...values);
`,
			snapshot: `
const values = [1, 2, 3];
Math.min.apply(Math, values);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const messages = ["hello", "world"];
console.log.apply(console, messages);
`,
			files: {
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"lib": ["esnext", "DOM"]
	}
}`,
			},
			output: `
const messages = ["hello", "world"];
console.log(...messages);
`,
			snapshot: `
const messages = ["hello", "world"];
console.log.apply(console, messages);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
function fn(...args: number[]) { return args; }
function getArgs() { return [1, 2, 3]; }
fn.apply(null, getArgs());
`,
			output: `
function fn(...args: number[]) { return args; }
function getArgs() { return [1, 2, 3]; }
fn(...getArgs());
`,
			snapshot: `
function fn(...args: number[]) { return args; }
function getArgs() { return [1, 2, 3]; }
fn.apply(null, getArgs());
~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
function fn(...args: number[]) { return args; }
const condition = true;
const a = [1, 2];
const b = [3, 4];
fn.apply(undefined, (condition ? a : b));
`,
			output: `
function fn(...args: number[]) { return args; }
const condition = true;
const a = [1, 2];
const b = [3, 4];
fn(...(condition ? a : b));
`,
			snapshot: `
function fn(...args: number[]) { return args; }
const condition = true;
const a = [1, 2];
const b = [3, 4];
fn.apply(undefined, (condition ? a : b));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const example = {
    bar: {
        baz(...args: number[]) { return args; }
    }
};
const items = [1, 2, 3];
example.bar.baz.apply(example.bar, items);
`,
			output: `
const example = {
    bar: {
        baz(...args: number[]) { return args; }
    }
};
const items = [1, 2, 3];
example.bar.baz(...items);
`,
			snapshot: `
const example = {
    bar: {
        baz(...args: number[]) { return args; }
    }
};
const items = [1, 2, 3];
example.bar.baz.apply(example.bar, items);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const args = [Math.max, undefined, [1, 2, 3]] as [typeof Math.max, undefined, number[]];
Reflect.apply.apply(Reflect, args);
`,
			output: `
const args = [Math.max, undefined, [1, 2, 3]] as [typeof Math.max, undefined, number[]];
Reflect.apply(...args);
`,
			snapshot: `
const args = [Math.max, undefined, [1, 2, 3]] as [typeof Math.max, undefined, number[]];
Reflect.apply.apply(Reflect, args);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
		{
			code: `
const items = [1, 2, 3];
Array.prototype.push.apply(Array.prototype, items);
`,
			output: `
const items = [1, 2, 3];
Array.prototype.push(...items);
`,
			snapshot: `
const items = [1, 2, 3];
Array.prototype.push.apply(Array.prototype, items);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use the spread operator instead of \`.apply()\`.
`,
		},
	],
	valid: [
		`function example(...args: number[]) { return args; } example(...[1, 2, 3]);`,
		`const obj = { example() {} }; obj.example();`,
		`Math.max(...[1, 2, 3]);`,
		`
function example(...values: number[]) { return values; }
example.apply({}, [1, 2, 3]);
`,
		`
function example(...values: number[]) { return values; }
example.apply(undefined, [1, 2, 3]);
`,
		`
const a = 1;
const b = 2;
const c = 3;
function example(...values: number[]) { return values; }
example.apply(null, [a, b, c]);
`,
		`
function example(...values: number[]) { return values; }
example.call(undefined, 1, 2, 3);
`,
		`
const someThis = {};
const args = [1, 2, 3];
function example(...values: number[]) { return values; }
example.apply(someThis, args);
`,
		`function example() {} example.apply(undefined);`,
		`
const otherObj = {};
const example = { bar() {} };
example.bar.apply(otherObj, []);
`,
		`
const array: number[] = [];
[0].push.apply(array, [1, 2]);
`,
		`
const args = [1, 2];
function example(...values: number[]) { return values; }
example["apply"](null, args);
`,
		`
function example(...values: number[]) { return values; }
example.apply(this, [1, 2]);
`,
		`
const differentObj = {};
const obj = { method() {} };
obj.method.apply(differentObj, []);
`,
		`
const a = { b: { c() {} } };
a.b.c.apply(a, []);
`,
		`function func() {} func.apply(null);`,
		`function func() {} func.apply(undefined);`,
		`
function func(...values: number[]) { return values; }
const args: [number[]] = [[1, 2]];
func.apply(null, ...args);
`,
		`
const args = [1, 2];
function func(...values: number[]) { return values; }
func.apply(null, [...args]);
`,
		`
const bar = {};
function example(...values: number[]) { return values; }
example.apply(bar, [1, 2]);
`,
		`
const a = { b() {} };
const c = { d() {} };
a.b.apply(c.d, []);
`,
		`
const otherObj = {};
const obj = { method() {} };
obj.method.apply(otherObj, []);
`,
		`
interface CustomInterface {
    apply(thisArg: unknown, args: unknown[]): void;
}
declare const customObj: CustomInterface;
const args = [1, 2, 3];
customObj.apply(null, args);
`,
		`
interface ApplyLike {
    apply(context: null, items: number[]): void;
}
const obj: ApplyLike = { apply(context, items) { context; items; } };
const items = [1, 2];
obj.apply(null, items);
`,
	],
});
