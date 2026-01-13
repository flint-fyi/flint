import { ruleTester } from "./ruleTester.ts";
import rule from "./symbolDescriptions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const symbol = Symbol();
`,
			snapshot: `
const symbol = Symbol();
               ~~~~~~~~
               Symbols without descriptions are more difficult to debug or reason about.
`,
		},
		{
			code: `
const uniqueKey = Symbol();
`,
			snapshot: `
const uniqueKey = Symbol();
                  ~~~~~~~~
                  Symbols without descriptions are more difficult to debug or reason about.
`,
		},
		{
			code: `
const symbols = [Symbol(), Symbol()];
`,
			snapshot: `
const symbols = [Symbol(), Symbol()];
                 ~~~~~~~~
                 Symbols without descriptions are more difficult to debug or reason about.
                           ~~~~~~~~
                           Symbols without descriptions are more difficult to debug or reason about.
`,
		},
		{
			code: `
function createSymbol() {
	return Symbol();
}
`,
			snapshot: `
function createSymbol() {
	return Symbol();
	       ~~~~~~~~
	       Symbols without descriptions are more difficult to debug or reason about.
}
`,
		},
		{
			code: `
const obj = {
	key: Symbol(),
};
`,
			snapshot: `
const obj = {
	key: Symbol(),
	     ~~~~~~~~
	     Symbols without descriptions are more difficult to debug or reason about.
};
`,
		},
		{
			code: `
const value = condition ? Symbol() : null;
`,
			snapshot: `
const value = condition ? Symbol() : null;
                          ~~~~~~~~
                          Symbols without descriptions are more difficult to debug or reason about.
`,
		},
	],
	valid: [
		`const symbol = Symbol("description");`,
		`const uniqueKey = Symbol("uniqueKey");`,
		`const mySymbol = Symbol("my symbol");`,
		`const symbols = [Symbol("first"), Symbol("second")];`,
		`function createSymbol() { return Symbol("created"); }`,
		`const obj = { key: Symbol("key") };`,
		`const value = Symbol.for("global");`,
		`const iterator = Symbol.iterator;`,
		`const hasInstance = Symbol.hasInstance;`,
		`const primitiveValue = Symbol.toPrimitive;`,
		`Symbol("valid")`,
	],
});
