import rule from "./defaultParameterLast.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function greet(name = "World", greeting: string) {}
`,
			snapshot: `
function greet(name = "World", greeting: string) {}
                               ~~~~~~~~~~~~~~~~
                               Default parameters should be last to allow omitting optional tail arguments.
`,
		},
		{
			code: `
function example(a = 1, b: number, c = 2) {}
`,
			snapshot: `
function example(a = 1, b: number, c = 2) {}
                        ~~~~~~~~~
                        Default parameters should be last to allow omitting optional tail arguments.
`,
		},
		{
			code: `
const fn = (x = 0, y: number) => x + y;
`,
			snapshot: `
const fn = (x = 0, y: number) => x + y;
                   ~~~~~~~~~
                   Default parameters should be last to allow omitting optional tail arguments.
`,
		},
		{
			code: `
class Example {
    method(a = 1, b: number) {}
}
`,
			snapshot: `
class Example {
    method(a = 1, b: number) {}
                  ~~~~~~~~~
                  Default parameters should be last to allow omitting optional tail arguments.
}
`,
		},
		{
			code: `
class Example {
    constructor(a = 1, b: number) {}
}
`,
			snapshot: `
class Example {
    constructor(a = 1, b: number) {}
                       ~~~~~~~~~
                       Default parameters should be last to allow omitting optional tail arguments.
}
`,
		},
		{
			code: `
function example(a?: number, b: number) {}
`,
			snapshot: `
function example(a?: number, b: number) {}
                             ~~~~~~~~~
                             Default parameters should be last to allow omitting optional tail arguments.
`,
		},
	],
	valid: [
		"function greet(greeting: string, name = 'World') {}",
		"function example(a: number, b = 1, c = 2) {}",
		"const fn = (y: number, x = 0) => x + y;",
		"class Example { method(b: number, a = 1) {} }",
		"function example(...args: number[]) {}",
		"function example(a = 1, ...rest: number[]) {}",
		"function example(a?: number, b?: number) {}",
		"function example(a = 1, b = 2) {}",
	],
});
