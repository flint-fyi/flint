import { ruleTester } from "./ruleTester.ts";
import rule from "./shadowedRestrictedNames.ts";

ruleTester.describe(rule, {
	invalid: [
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
const arrowFunc = (undefined: number) => undefined;
`,
			snapshot: `
const arrowFunc = (undefined: number) => undefined;
                   ~~~~~~~~~
                   This variable misleadingly shadows the global \`undefined\`.
`,
		},
		{
			code: `
declare const obj: { undefined: number };

function test() {
    const { undefined } = obj;
}
`,
			snapshot: `
declare const obj: { undefined: number };

function test() {
    const { undefined } = obj;
            ~~~~~~~~~
            This variable misleadingly shadows the global \`undefined\`.
}
`,
		},
		{
			code: `
declare const array: [number];

function test() {
    const [NaN] = array;
}
`,
			snapshot: `
declare const array: [number];

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
		`
declare const obj: { undefined: number };

obj.undefined = 5;
`,
	],
});
