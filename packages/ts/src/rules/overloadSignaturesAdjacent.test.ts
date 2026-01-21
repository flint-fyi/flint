import rule from "./overloadSignaturesAdjacent.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function f(x: number): void;
function other(): void {}
function f(x: string): void;
function f(x: number | string): void {}
`,
			snapshot: `
function f(x: number): void;
function other(): void {}
function f(x: string): void;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Function overload signatures should be consecutive.
function f(x: number | string): void {}
`,
		},
		{
			code: `
interface I {
	method(x: number): void;
	other(): void;
	method(x: string): void;
	method(x: number | string): void;
}
`,
			snapshot: `
interface I {
	method(x: number): void;
	other(): void;
	method(x: string): void;
	~~~~~~~~~~~~~~~~~~~~~~~~
	Function overload signatures should be consecutive.
	method(x: number | string): void;
}
`,
		},
		{
			code: `
type T = {
	method(x: number): void;
	other(): void;
	method(x: string): void;
};
`,
			snapshot: `
type T = {
	method(x: number): void;
	other(): void;
	method(x: string): void;
	~~~~~~~~~~~~~~~~~~~~~~~~
	Function overload signatures should be consecutive.
};
`,
		},
	],
	valid: [
		`
function f(x: number): void;
function f(x: string): void;
function f(x: number | string): void {}
`,
		`
interface I {
	method(x: number): void;
	method(x: string): void;
	method(x: number | string): void;
}
`,
		`
type T = {
	method(x: number): void;
	method(x: string): void;
};
`,
		`
function f(x: number): void;
function f(x: string): void;
function f(x: number | string): void {}

function g(y: boolean): void;
function g(y: number): void;
function g(y: boolean | number): void {}
`,
	],
});
