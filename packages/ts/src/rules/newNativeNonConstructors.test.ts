import rule from "./newNativeNonConstructors.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
new Symbol("description");
`,
			output: `
Symbol("description");
`,
			snapshot: `
new Symbol("description");
~~~
Symbol cannot be called with \`new\`.
`,
		},
		{
			code: `
new BigInt(42);
`,
			output: `
BigInt(42);
`,
			snapshot: `
new BigInt(42);
~~~
BigInt cannot be called with \`new\`.
`,
		},
		{
			code: `
const value = new Symbol();
`,
			output: `
const value = Symbol();
`,
			snapshot: `
const value = new Symbol();
              ~~~
              Symbol cannot be called with \`new\`.
`,
		},
		{
			code: `
function create() {
    return new BigInt(100);
}
`,
			output: `
function create() {
    return BigInt(100);
}
`,
			snapshot: `
function create() {
    return new BigInt(100);
           ~~~
           BigInt cannot be called with \`new\`.
}
`,
		},
	],
	valid: [
		`Symbol("description");`,
		`BigInt(42);`,
		`const value = Symbol();`,
		`const number = BigInt(100);`,
		`function create() { return Symbol("key"); }`,
		`const array = [Symbol("a"), Symbol("b")];`,
		`new String("text");`,
		`new Number(42);`,
		`new Boolean(true);`,
		`new Object();`,
		`new Array();`,
		`new Date();`,
		`new Error("message");`,
		`new Map();`,
		`new Set();`,
		`new Promise((resolve) => resolve());`,
		`new WeakMap();`,
		`new WeakSet();`,
		`
			class BigInt {}
			new BigInt();
			export {}
		`,
		`
			class Symbol {}
			new Symbol();
			export {}
		`,
	],
});
