import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./newNativeNonConstructors.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
new Symbol("description");
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			output: `
Symbol("description");
`,
			snapshot: `
new Symbol("description");
~~~
Symbol cannot be called with \`new\`.
`,
		},
	],
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
