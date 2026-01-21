import rule from "./parameterReassignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function f(x: number) {
	x = 5;
}
`,
			snapshot: `
function f(x: number) {
	x = 5;
	~
	Do not reassign function parameters.
}
`,
		},
		{
			code: `
const fn = (value: string) => {
	value = "new";
};
`,
			snapshot: `
const fn = (value: string) => {
	value = "new";
	~~~~~
	Do not reassign function parameters.
};
`,
		},
		{
			code: `
function f(x: number) {
	x += 1;
}
`,
			snapshot: `
function f(x: number) {
	x += 1;
	~
	Do not reassign function parameters.
}
`,
		},
		{
			code: `
function f(count: number) {
	count--;
}
`,
			snapshot: `
function f(count: number) {
	count--;
	~~~~~
	Do not reassign function parameters.
}
`,
		},
		{
			code: `
function f(x: number) {
	x++;
}
`,
			snapshot: `
function f(x: number) {
	x++;
	~
	Do not reassign function parameters.
}
`,
		},
		{
			code: `
function f(x: number) {
	x -= 2;
}
`,
			snapshot: `
function f(x: number) {
	x -= 2;
	~
	Do not reassign function parameters.
}
`,
		},
		{
			code: `
function f(x: number) {
	x *= 3;
}
`,
			snapshot: `
function f(x: number) {
	x *= 3;
	~
	Do not reassign function parameters.
}
`,
		},
		{
			code: `
function f(x: number) {
	x /= 2;
}
`,
			snapshot: `
function f(x: number) {
	x /= 2;
	~
	Do not reassign function parameters.
}
`,
		},
	],
	valid: [
		`
function f(x: number) {
	const y = x;
	y = 5;
}
`,
		`
function f(x: number) {
	let x = 5;
}
`,
		`
function f() {
	x = 5;
}
`,
		`
function f(x: number) {
	function inner() {
		x = 5;
	}
}
`,
		`
const f = (x: number) => {
	const fn = () => {
		x = 5;
	};
};
`,
		`
function f(x: number) {
	x.prop = 5;
}
`,
		`
function f(x: { prop: number }) {
	const temp = x;
	temp = { prop: 5 };
}
`,
	],
});
