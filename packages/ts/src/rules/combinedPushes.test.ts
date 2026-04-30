import rule from "./combinedPushes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const arr: string[] = [];
arr.push("a");
arr.push("b");
`,
			snapshot: `
const arr: string[] = [];
arr.push("a");
~~~~~~~~~~~~~~
Consecutive \`.push()\` calls can be combined into a single call.
arr.push("b");
~~~~~~~~~~~~~~
`,
		},
		{
			code: `
const arr: number[] = [];
arr.push(1);
arr.push(2);
arr.push(3);
`,
			snapshot: `
const arr: number[] = [];
arr.push(1);
~~~~~~~~~~~~
Consecutive \`.push()\` calls can be combined into a single call.
arr.push(2);
~~~~~~~~~~~~
~~~~~~~~~~~~
Consecutive \`.push()\` calls can be combined into a single call.
arr.push(3);
~~~~~~~~~~~~
`,
		},
		{
			code: `
function test() {
	const items: string[] = [];
	items.push("x");
	items.push("y");
}
`,
			snapshot: `
function test() {
	const items: string[] = [];
	items.push("x");
	~~~~~~~~~~~~~~~~
	Consecutive \`.push()\` calls can be combined into a single call.
	items.push("y");
	~~~~~~~~~~~~~~~~
}
`,
		},
	],
	valid: [
		`
const arr: string[] = [];
arr.push("a");
`,
		`
const arr: string[] = [];
arr.push("a");
console.log("something");
arr.push("b");
`,
		`
const arr1: string[] = [];
const arr2: string[] = [];
arr1.push("a");
arr2.push("b");
`,
		`
const obj = { push: () => {} };
obj.push();
obj.push();
`,
	],
});
