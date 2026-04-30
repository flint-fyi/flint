import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryBinds.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const handler = function() {
    console.log("hello");
}.bind(this);
`,
			output: `
const handler = function() {
    console.log("hello");
};
`,
			snapshot: `
const handler = function() {
    console.log("hello");
}.bind(this);
  ~~~~~~~~~~
  This \`.bind()\` call is unnecessary because the function does not use \`this\`.
`,
		},
		{
			code: `
const fn = function(x: number) {
    return x * 2;
}.bind(context);
`,
			output: `
const fn = function(x: number) {
    return x * 2;
};
`,
			snapshot: `
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
    console.log("hello");
}).bind(this);
`,
			output: `
const arrow = (() => {
    console.log("hello");
});
`,
			snapshot: `
const arrow = (() => {
    console.log("hello");
}).bind(this);
   ~~~~~~~~~~
   \`.bind()\` has no effect on arrow functions.
`,
		},
		{
			code: `
const arrowWithThis = (() => {
    this.foo();
}).bind(context);
`,
			output: `
const arrowWithThis = (() => {
    this.foo();
});
`,
			snapshot: `
const arrowWithThis = (() => {
    this.foo();
}).bind(context);
   ~~~~~~~~~~~~~
   \`.bind()\` has no effect on arrow functions.
`,
		},
		{
			code: `
const arrow = (() => {}).bind(context);
`,
			output: `
const arrow = (() => {});
`,
			snapshot: `
const arrow = (() => {}).bind(context);
                         ~~~~~~~~~~~~~
                         \`.bind()\` has no effect on arrow functions.
`,
		},
		{
			code: `
const arrow = (() => {}).bind(createContext());
`,
			snapshot: `
const arrow = (() => {}).bind(createContext());
                         ~~~~~~~~~~~~~~~~~~~~~
                         \`.bind()\` has no effect on arrow functions.
`,
		},
	],
	valid: [
		`
const handler = function() {
    this.handleClick();
}.bind(this);
`,
		`
const fn = function() {
    return this.value * 2;
}.bind(context);
`,
		`
const regular = function() {
    console.log("hello");
};
`,
		`
const arrow = () => {
    console.log("hello");
};
`,
		`obj.method.bind(obj);`,
		`fn.bind(context, arg1, arg2);`,
	],
});
