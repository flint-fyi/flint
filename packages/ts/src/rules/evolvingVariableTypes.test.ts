import rule from "./evolvingVariableTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value;
`,
			snapshot: `
let value;
    ~~~~~
    Variable 'value' has an implicit evolving 'any' type due to missing type annotation and initializer.
`,
		},
		{
			code: `
var value;
`,
			snapshot: `
var value;
    ~~~~~
    Variable 'value' has an implicit evolving 'any' type due to missing type annotation and initializer.
`,
		},
		{
			code: `
let first, second;
`,
			snapshot: `
let first, second;
    ~~~~~
    Variable 'first' has an implicit evolving 'any' type due to missing type annotation and initializer.
           ~~~~~~
           Variable 'second' has an implicit evolving 'any' type due to missing type annotation and initializer.
`,
		},
		{
			code: `
let value;
value = 1;
`,
			snapshot: `
let value;
    ~~~~~
    Variable 'value' has an implicit evolving 'any' type due to missing type annotation and initializer.
value = 1;
`,
		},
		{
			code: `
function process() {
    let result;
    result = compute();
    return result;
}
`,
			snapshot: `
function process() {
    let result;
        ~~~~~~
        Variable 'result' has an implicit evolving 'any' type due to missing type annotation and initializer.
    result = compute();
    return result;
}
`,
		},
		{
			code: `
let initialized = 1, uninitialized;
`,
			snapshot: `
let initialized = 1, uninitialized;
                     ~~~~~~~~~~~~~
                     Variable 'uninitialized' has an implicit evolving 'any' type due to missing type annotation and initializer.
`,
		},
	],
	valid: [
		`let value = 1;`,
		`let value: number;`,
		`let value: string = "hello";`,
		`const value = 1;`,
		`var value = null;`,
		`var value: unknown;`,
		`let { a, b } = obj;`,
		`let [first, second] = arr;`,
		`for (let item of items) {}`,
		`for (let key in obj) {}`,
		{
			code: `declare let value;`,
			fileName: "file.d.ts",
		},
	],
});
