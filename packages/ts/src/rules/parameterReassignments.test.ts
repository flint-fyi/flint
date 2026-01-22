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
	Reassigning function parameters can make them more difficult to reason about.
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
	Reassigning function parameters can make them more difficult to reason about.
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
	Reassigning function parameters can make them more difficult to reason about.
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
	Reassigning function parameters can make them more difficult to reason about.
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
	Reassigning function parameters can make them more difficult to reason about.
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
	Reassigning function parameters can make them more difficult to reason about.
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
	Reassigning function parameters can make them more difficult to reason about.
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
	Reassigning function parameters can make them more difficult to reason about.
}
`,
		},
		{
			code: `
function f({ x }: { x: number }) {
	x = 5;
}
`,
			snapshot: `
function f({ x }: { x: number }) {
	x = 5;
	~
	Reassigning function parameters can make them more difficult to reason about.
}
`,
		},
		{
			code: `
function f([a, b]: [number, number]) {
	a = 5;
}
`,
			snapshot: `
function f([a, b]: [number, number]) {
	a = 5;
	~
	Reassigning function parameters can make them more difficult to reason about.
}
`,
		},
		{
			code: `
function f({ x, y }: { x: number; y: string }) {
	y = "new";
}
`,
			snapshot: `
function f({ x, y }: { x: number; y: string }) {
	y = "new";
	~
	Reassigning function parameters can make them more difficult to reason about.
}
`,
		},
		{
			code: `
function f([x, , z]: [number, string, boolean]) {
	z++;
}
`,
			snapshot: `
function f([x, , z]: [number, string, boolean]) {
	z++;
	~
	Reassigning function parameters can make them more difficult to reason about.
}
`,
		},
		{
			code: `
function f({ a: x }: { a: number }) {
	x = 5;
}
`,
			snapshot: `
function f({ a: x }: { a: number }) {
	x = 5;
	~
	Reassigning function parameters can make them more difficult to reason about.
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
		`
function f({ x }: { x: number }) {
	const y = x;
	y = 5;
}
`,
		`
function f([a, b]: [number, string]) {
	const c = a;
	c = 10;
}
`,
		`
function f({ x, y }: { x: number; y: string }) {
	x.toString();
	y.charAt(0);
}
`,
	],
});
