import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryBinds.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const handler = function() {
    "hello";
}.bind(this);
`,
			output: `
const handler = function() {
    "hello";
};
`,
			snapshot: `
const handler = function() {
    "hello";
}.bind(this);
  ~~~~~~~~~~
  This \`.bind()\` call is unnecessary because the function does not use \`this\`.
`,
		},
		{
			code: `
declare const context: unknown;

const fn = function(x: number) {
    return x * 2;
}.bind(context);
`,
			output: `
declare const context: unknown;

const fn = function(x: number) {
    return x * 2;
};
`,
			snapshot: `
declare const context: unknown;

const fn = function(x: number) {
    return x * 2;
}.bind(context);
  ~~~~~~~~~~~~~
  This \`.bind()\` call is unnecessary because the function does not use \`this\`.
`,
		},
		{
			code: `
const arrow = (() => {
    "hello";
}).bind(this);
`,
			output: `
const arrow = (() => {
    "hello";
});
`,
			snapshot: `
const arrow = (() => {
    "hello";
}).bind(this);
   ~~~~~~~~~~
   \`.bind()\` has no effect on arrow functions.
`,
		},
		{
			code: `
declare const context: unknown;

class Example {
    foo() {}

    method() {
        const arrowWithThis = (() => {
            this.foo();
        }).bind(context);
    }
}
`,
			output: `
declare const context: unknown;

class Example {
    foo() {}

    method() {
        const arrowWithThis = (() => {
            this.foo();
        });
    }
}
`,
			snapshot: `
declare const context: unknown;

class Example {
    foo() {}

    method() {
        const arrowWithThis = (() => {
            this.foo();
        }).bind(context);
           ~~~~~~~~~~~~~
           \`.bind()\` has no effect on arrow functions.
    }
}
`,
		},
		{
			code: `
declare const context: unknown;

const arrow = (() => {}).bind(context);
`,
			output: `
declare const context: unknown;

const arrow = (() => {});
`,
			snapshot: `
declare const context: unknown;

const arrow = (() => {}).bind(context);
                         ~~~~~~~~~~~~~
                         \`.bind()\` has no effect on arrow functions.
`,
		},
		{
			code: `
declare function createContext(): unknown;

const arrow = (() => {}).bind(createContext());
`,
			snapshot: `
declare function createContext(): unknown;

const arrow = (() => {}).bind(createContext());
                         ~~~~~~~~~~~~~~~~~~~~~
                         \`.bind()\` has no effect on arrow functions.
`,
		},
	],
	valid: [
		`
declare const context: { handleClick(): void };

const handler = function(this: { handleClick(): void }) {
    this.handleClick();
}.bind(context);
`,
		`
declare const context: { value: number };

const fn = function(this: { value: number }) {
    return this.value * 2;
}.bind(context);
`,
		`
const regular = function() {
    "hello";
};
`,
		`
const arrow = () => {
    "hello";
};
`,
		`
const object = {
    method() {},
};

object.method.bind(object);
`,
		`
declare const context: unknown;
declare const firstArgument: string;
declare const secondArgument: string;

function callback(first: string, second: string) {}

callback.bind(context, firstArgument, secondArgument);
`,
	],
});
