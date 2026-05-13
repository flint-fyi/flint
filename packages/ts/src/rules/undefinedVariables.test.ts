import { ruleTester } from "./ruleTester.ts";
import rule from "./undefinedVariables.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
undefinedVar;
`,
			snapshot: `
undefinedVar;
~~~~~~~~~~~~
Variable 'undefinedVar' is used but was never defined.
`,
		},
		{
			code: `
function test() {
    return notDefined;
}
`,
			snapshot: `
function test() {
    return notDefined;
           ~~~~~~~~~~
           Variable 'notDefined' is used but was never defined.
}
`,
		},
		{
			code: `
const value = unknownVariable;
`,
			snapshot: `
const value = unknownVariable;
              ~~~~~~~~~~~~~~~
              Variable 'unknownVariable' is used but was never defined.
`,
		},
		{
			code: `
if (condition) {
    doSomething();
}
`,
			snapshot: `
if (condition) {
    ~~~~~~~~~
    Variable 'condition' is used but was never defined.
    doSomething();
    ~~~~~~~~~~~
    Variable 'doSomething' is used but was never defined.
}
`,
		},
		{
			code: `
const result = first + second;
`,
			snapshot: `
const result = first + second;
               ~~~~~
               Variable 'first' is used but was never defined.
                       ~~~~~~
                       Variable 'second' is used but was never defined.
`,
		},
	],
	valid: [
		`const value = 5; value;`,
		`function test(parameter: number) { return parameter; }`,
		`let count = 0; count++;`,
		`const obj = { prop: 1 }; obj.prop;`,
		`typeof undefinedVar === "undefined"`,
		`const obj = {}; const { prop } = obj;`,
		`function fn() { return 1; } fn();`,
		`class MyClass {} const instance = new MyClass();`,
		`import { value } from "module"; value;`,
		`const array = [1, 2, 3]; array.forEach(item => item);`,
	],
});
