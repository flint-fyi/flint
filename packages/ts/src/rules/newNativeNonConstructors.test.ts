import rule from "./newNativeNonConstructors.ts";
import { javascriptRuleTester, ruleTester } from "./ruleTester.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
new Symbol("description");
`,
			},
			output: {
				"file.js": `
Symbol("description");
`,
			},
			snapshot: {
				"file.js": `
new Symbol("description");
~~~
Symbol cannot be called with \`new\`.
`,
			},
		},
	],
	valid: [],
});

ruleTester.describe(rule, {
	invalid: [],
	valid: [
		`Symbol("description");`,
		`BigInt(42);`,
		`const value = Symbol(); void value;`,
		`const number = BigInt(100); void number;`,
		`function create() { return Symbol("key"); } void create;`,
		`const array = [Symbol("a"), Symbol("b")]; void array;`,
		`new String("text");`,
		`new Number(42);`,
		`new Boolean(true);`,
		`new Object();`,
		`new Array();`,
		`new Date();`,
		`new Error("message");`,
		`new Map();`,
		`new Set();`,
		`new Promise<void>((resolve) => resolve());`,
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
