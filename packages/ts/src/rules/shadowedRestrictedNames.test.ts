import { ruleTester } from "./ruleTester.ts";
import rule from "./shadowedRestrictedNames.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let undefined = 5;
`,
			snapshot: `
let undefined = 5;
    ~~~~~~~~~
    This variable misleadingly shadows the global \`undefined\`.
`,
		},
		{
			code: `
const NaN = 123;
`,
			snapshot: `
const NaN = 123;
      ~~~
      This variable misleadingly shadows the global \`NaN\`.
`,
		},
		{
			code: `
var Infinity = 100;
`,
			snapshot: `
var Infinity = 100;
    ~~~~~~~~
    This variable misleadingly shadows the global \`Infinity\`.
`,
		},
		{
			code: `
function test(arguments) {
    return arguments.length;
}
`,
			snapshot: `
function test(arguments) {
              ~~~~~~~~~
              This variable misleadingly shadows the global \`arguments\`.
    return arguments.length;
}
`,
		},
		{
			code: `
function eval() {
    return 42;
}
`,
			snapshot: `
function eval() {
         ~~~~
         This variable misleadingly shadows the global \`eval\`.
    return 42;
}
`,
		},
		{
			code: `
const arrowFunc = (undefined) => undefined;
`,
			snapshot: `
const arrowFunc = (undefined) => undefined;
                   ~~~~~~~~~
                   This variable misleadingly shadows the global \`undefined\`.
`,
		},
		{
			code: `
class NaN {
    constructor() {}
}
`,
			snapshot: `
class NaN {
      ~~~
      This variable misleadingly shadows the global \`NaN\`.
    constructor() {}
}
`,
		},
		{
			code: `
const obj = {
    method(eval) {
        return eval;
    }
};
`,
			snapshot: `
const obj = {
    method(eval) {
           ~~~~
           This variable misleadingly shadows the global \`eval\`.
        return eval;
    }
};
`,
		},
		{
			code: `
function test() {
    const { undefined } = obj;
}
`,
			snapshot: `
function test() {
    const { undefined } = obj;
            ~~~~~~~~~
            This variable misleadingly shadows the global \`undefined\`.
}
`,
		},
		{
			code: `
function test() {
    const [NaN] = array;
}
`,
			snapshot: `
function test() {
    const [NaN] = array;
           ~~~
           This variable misleadingly shadows the global \`NaN\`.
}
`,
		},
	],
	valid: [
		`let value = undefined;`,
		`const result = NaN;`,
		`const max = Infinity;`,
		`function test() { return arguments; }`,
		`const code = eval("1 + 1");`,
		`let myValue = 5;`,
		`function myFunction() {}`,
		`class MyClass {}`,
		`const obj = { undefined: 5 };`,
		`const key = "undefined";`,
		`obj.undefined = 5;`,
	],
});
