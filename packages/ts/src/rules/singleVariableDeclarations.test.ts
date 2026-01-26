import { ruleTester } from "./ruleTester.ts";
import rule from "./singleVariableDeclarations.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let first, second, third;
`,
			snapshot: `
let first, second, third;
~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
const width = 100, height = 200;
`,
			snapshot: `
const width = 100, height = 200;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
var name = 'Alice', age = 30;
`,
			snapshot: `
var name = 'Alice', age = 30;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
		{
			code: `
for (let index = 0, length = 10; index < length; index++) {
    console.log(index);
}
`,
			snapshot: `
for (let index = 0, length = 10; index < length; index++) {
     ~~~~~~~~~~~~~~~~~~~~~~~~~~
     Split this into separate variable declarations.
    console.log(index);
}
`,
		},
		{
			code: `
let initialized = 1, uninitialized;
`,
			snapshot: `
let initialized = 1, uninitialized;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Split this into separate variable declarations.
`,
		},
	],
	valid: [
		`let first;`,
		`let first;
let second;
let third;`,
		`const width = 100;
const height = 200;`,
		`var name = 'Alice';
var age = 30;`,
		`const { first, second } = object;`,
		`const [first, second] = array;`,
		`const { first, second, third } = object;`,
		`const [first, second, third] = array;`,
		`for (const item of items) {
    console.log(item);
}`,
		`for (const key in object) {
    console.log(key);
}`,
		`for (let index = 0; index < 10; index++) {
    console.log(index);
}`,
	],
});
