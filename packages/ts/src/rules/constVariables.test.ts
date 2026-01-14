import rule from "./constVariables.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value = 1;
console.log(value);
`,
			snapshot: `
let value = 1;
    ~~~~~
    'value' is never reassigned. Use \`const\` instead of \`let\`.
console.log(value);
`,
		},
		{
			code: `
let name = "hello";
`,
			snapshot: `
let name = "hello";
    ~~~~
    'name' is never reassigned. Use \`const\` instead of \`let\`.
`,
		},
		{
			code: `
let obj = { key: "value" };
obj.key = "updated";
`,
			snapshot: `
let obj = { key: "value" };
    ~~~
    'obj' is never reassigned. Use \`const\` instead of \`let\`.
obj.key = "updated";
`,
		},
		{
			code: `
let arr = [1, 2, 3];
arr.push(4);
`,
			snapshot: `
let arr = [1, 2, 3];
    ~~~
    'arr' is never reassigned. Use \`const\` instead of \`let\`.
arr.push(4);
`,
		},
		{
			code: `
let { a, b } = getValues();
console.log(a, b);
`,
			snapshot: `
let { a, b } = getValues();
      ~
      'a' is never reassigned. Use \`const\` instead of \`let\`.
console.log(a, b);
`,
		},
		{
			code: `
let [first, second] = getArray();
console.log(first, second);
`,
			snapshot: `
let [first, second] = getArray();
     ~~~~~
     'first' is never reassigned. Use \`const\` instead of \`let\`.
console.log(first, second);
`,
		},
		{
			code: `
function example() {
    let inner = 42;
    return inner;
}
`,
			snapshot: `
function example() {
    let inner = 42;
        ~~~~~
        'inner' is never reassigned. Use \`const\` instead of \`let\`.
    return inner;
}
`,
		},
	],
	valid: [
		`const value = 1;`,
		`let value = 1; value = 2;`,
		`let count = 0; count++;`,
		`let num = 10; num--;`,
		`let sum = 0; sum += 5;`,
		`let diff = 10; diff -= 3;`,
		`let product = 1; product *= 2;`,
		`let quotient = 10; quotient /= 2;`,
		`let value; value = 1;`,
		`let a = 1, b = 2; a = 3;`,
		`let { x, y } = point; x = 10;`,
		`let [first, second] = arr; first = "new";`,
		`for (let i = 0; i < 10; i++) { console.log(i); }`,
		`for (let item of items) { console.log(item); }`,
		`for (let key in obj) { console.log(key); }`,
		`var value = 1;`,
	],
});
