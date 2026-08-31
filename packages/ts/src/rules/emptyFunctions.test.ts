import rule from "./emptyFunctions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function foo() {}
`,
			snapshot: `
function foo() {}
~~~~~~~~~~~~~~~~~
Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
const foo = function() {};
`,
			snapshot: `
const foo = function() {};
            ~~~~~~~~~~~~~
            Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
const foo = () => {};
`,
			snapshot: `
const foo = () => {};
            ~~~~~~~~
            Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
class Foo { bar() {} }
`,
			snapshot: `
class Foo { bar() {} }
            ~~~~~~~~
            Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
class Foo { constructor() {} }
`,
			snapshot: `
class Foo { constructor() {} }
            ~~~~~~~~~~~~~~~~
            Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
class Foo { set bar(value: number) {} }
`,
			snapshot: `
class Foo { set bar(value: number) {} }
            ~~~~~~~~~~~~~~~~~~~~~~~~~
            Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
async function foo() {}
`,
			snapshot: `
async function foo() {}
~~~~~~~~~~~~~~~~~~~~~~~
Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
function* foo() {}
`,
			snapshot: `
function* foo() {}
~~~~~~~~~~~~~~~~~~
Empty functions should contain code or a comment explaining why they are empty.
`,
		},
		{
			code: `
const obj = { foo() {} };
`,
			snapshot: `
const obj = { foo() {} };
              ~~~~~~~~
              Empty functions should contain code or a comment explaining why they are empty.
`,
		},
	],
	valid: [
		`
declare function doSomething(): void;
function foo() { doSomething(); }
`,
		`
declare function doSomething(): void;
const foo = function() { doSomething(); };
`,
		`
declare function doSomething(): void;
const foo = () => { doSomething(); };
`,
		`
declare function doSomething(): void;
const foo = () => doSomething();
`,
		`
declare function doSomething(): void;
class Foo { bar() { doSomething(); } }
`,
		`
declare function doSomething(): void;
class Foo { constructor() { doSomething(); } }
`,
		`class Foo { private _bar = 0; get bar() { return this._bar; } }`,
		`class Foo { private _bar = 0; set bar(value: number) { this._bar = value; } }`,
		`function foo() { /* intentionally empty */ }`,
		`
const foo = function() {
    // noop
};
`,
		`const foo = () => { /* empty */ };`,
		`class Foo { bar() { /* empty */ } }`,
		`class Foo { constructor() { /* empty */ } }`,
		`declare function foo(): void;`,
		`abstract class Foo { abstract bar(): void; }`,
		`
export function makeDisposable<T extends object>(obj: T): Disposable & T {
	return {
		...obj,
		[Symbol.dispose]: () => () => {
			// Intentionally empty to satisfy the Disposable interface.
		},
	};
}
`,
	],
});
