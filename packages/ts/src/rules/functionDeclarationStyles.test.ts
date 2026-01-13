import rule from "./functionDeclarationStyles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function doSomething() {}
`,
			snapshot: `
function doSomething() {}
         ~~~~~~~~~~~
         For consistency, this project prefers a function expression instead of a function declaration.
`,
		},
		{
			code: `
function doSomething(value: number): string {
    return String(value);
}
`,
			snapshot: `
function doSomething(value: number): string {
         ~~~~~~~~~~~
         For consistency, this project prefers a function expression instead of a function declaration.
    return String(value);
}
`,
		},
		{
			code: `
const doSomething = function() {};
`,
			options: { style: "declaration" },
			snapshot: `
const doSomething = function() {};
      ~~~~~~~~~~~
      For consistency, this project prefers a function declaration instead of a function expression.
`,
		},
		{
			code: `
const doSomething = () => {};
`,
			options: { style: "declaration" },
			snapshot: `
const doSomething = () => {};
      ~~~~~~~~~~~
      For consistency, this project prefers a function declaration instead of a function expression.
`,
		},
		{
			code: `
const doSomething = () => {};
`,
			options: { allowArrowFunctions: false, style: "declaration" },
			snapshot: `
const doSomething = () => {};
      ~~~~~~~~~~~
      For consistency, this project prefers a function declaration instead of a function expression.
`,
		},
	],
	valid: [
		`const doSomething = function() {};`,
		`const doSomething = () => {};`,
		`const value = 42;`,
		`const doSomething = function namedFunction() {};`,
		{
			code: `function doSomething() {}`,
			options: { style: "declaration" },
		},
		{
			code: `const doSomething = () => {};`,
			options: { allowArrowFunctions: true, style: "declaration" },
		},
		{
			code: `
function overloaded(value: string): string;
function overloaded(value: number): number;
function overloaded(value: number | string): number | string {
    return value;
}
`,
		},
		{
			code: `const callback = (value: number) => value * 2;`,
		},
		{
			code: `const items = [1, 2, 3].map((value) => value * 2);`,
		},
	],
});
