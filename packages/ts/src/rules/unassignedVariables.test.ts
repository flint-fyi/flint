import { ruleTester } from "./ruleTester.ts";
import rule from "./unassignedVariables.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value;
`,
			snapshot: `
let value;
    ~~~~~
    Variable 'value' is declared but never assigned a value.
`,
		},
		{
			code: `
var variable;
console.log(variable);
`,
			snapshot: `
var variable;
    ~~~~~~~~
    Variable 'variable' is declared but never assigned a value.
console.log(variable);
`,
		},
		{
			code: `
let unassigned: number;
console.log(unassigned);
`,
			snapshot: `
let unassigned: number;
    ~~~~~~~~~~
    Variable 'unassigned' is declared but never assigned a value.
console.log(unassigned);
`,
		},
		{
			code: `
function example() {
    let local;
    return local;
}
`,
			snapshot: `
function example() {
    let local;
        ~~~~~
        Variable 'local' is declared but never assigned a value.
    return local;
}
`,
		},
	],
	valid: [
		`let assigned = 5;`,
		`const constant = 10;`,
		`var variable = "hello";`,
		`let value: number = 42;`,
		`let x; x = 5;`,
		`let y; y = 10; console.log(y);`,
		`var z; z += 1;`,
		`let counter; counter++;`,
		`let value; value--;`,
		`for (let index = 0; index < 10; index++) {}`,
		`for (let item; item < 10; item++) {}`,
		`let result; result ||= "default";`,
		`let data; data &&= "value";`,
		`let nullish; nullish ??= "fallback";`,
	],
});
