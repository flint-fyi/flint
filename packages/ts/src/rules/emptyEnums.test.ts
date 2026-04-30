import rule from "./emptyEnums.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
enum Status {}
`,
			snapshot: `
enum Status {}
~~~~~~~~~~~
Empty enums serve no purpose.
`,
		},
		{
			code: `
export enum Direction {}
`,
			snapshot: `
export enum Direction {}
~~~~~~~~~~~~~~~~~~~~~
Empty enums serve no purpose.
`,
		},
		{
			code: `
const enum Color {}
`,
			snapshot: `
const enum Color {}
~~~~~~~~~~~~~~~~
Empty enums serve no purpose.
`,
		},
		{
			code: `
declare enum HttpMethod {}
`,
			snapshot: `
declare enum HttpMethod {}
~~~~~~~~~~~~~~~~~~~~~~~
Empty enums serve no purpose.
`,
		},
	],
	valid: [
		`enum Status { Active, Inactive }`,
		`enum Direction { North, South, East, West }`,
		`const enum Color { Red = 1, Green = 2, Blue = 3 }`,
		`
enum Priority {
    Low,
    Medium,
    High,
}
`,
		`
export enum HttpStatus {
    OK = 200,
    NotFound = 404,
    ServerError = 500,
}
`,
	],
});
