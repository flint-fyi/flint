import rule from "./nonNullAssertedNullishCoalesces.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
value! ?? "default";
`,
			snapshot: `
value! ?? "default";
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
value ?? "default";
`,
				},
			],
		},
		{
			code: `
value! ?? other!;
`,
			snapshot: `
value! ?? other!;
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
value ?? other!;
`,
				},
			],
		},
		{
			code: `
object.property! ?? "default";
`,
			snapshot: `
object.property! ?? "default";
~~~~~~~~~~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
object.property ?? "default";
`,
				},
			],
		},
		{
			code: `
object!.property! ?? "default";
`,
			snapshot: `
object!.property! ?? "default";
~~~~~~~~~~~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
object!.property ?? "default";
`,
				},
			],
		},
		{
			code: `
getValue()! ?? "default";
`,
			snapshot: `
getValue()! ?? "default";
~~~~~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
getValue() ?? "default";
`,
				},
			],
		},
		{
			code: `
let value!: string;
value! ?? "";
`,
			snapshot: `
let value!: string;
value! ?? "";
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
let value!: string;
value ?? "";
`,
				},
			],
		},
		{
			code: `
let value: string;
value = getValue();
value! ?? "";
`,
			snapshot: `
let value: string;
value = getValue();
value! ?? "";
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
let value: string;
value = getValue();
value ?? "";
`,
				},
			],
		},
		{
			code: `
let value: string;
value = getValue();
value! ?? "";
value = other();
`,
			snapshot: `
let value: string;
value = getValue();
value! ?? "";
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
value = other();
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
let value: string;
value = getValue();
value ?? "";
value = other();
`,
				},
			],
		},
		{
			code: `
let value = getValue();
value! ?? "";
`,
			snapshot: `
let value = getValue();
value! ?? "";
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
let value = getValue();
value ?? "";
`,
				},
			],
		},
		{
			code: `
function test() {
    let value!: string;
    return value! ?? "";
}
`,
			snapshot: `
function test() {
    let value!: string;
    return value! ?? "";
           ~~~~~~
           The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
}
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
function test() {
    let value!: string;
    return value ?? "";
}
`,
				},
			],
		},
		{
			code: `
let value!: string;
function test() {
    return value! ?? "";
}
`,
			snapshot: `
let value!: string;
function test() {
    return value! ?? "";
           ~~~~~~
           The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
}
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
let value!: string;
function test() {
    return value ?? "";
}
`,
				},
			],
		},
		{
			code: `
let value = getValue();
value ! ?? "";
`,
			snapshot: `
let value = getValue();
value ! ?? "";
~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
let value = getValue();
value ?? "";
`,
				},
			],
		},
	],
	valid: [
		`value ?? "default";`,
		`value ?? other!;`,
		`object.property ?? "default";`,
		`object.property ?? other!;`,
		`object!.property ?? "default";`,
		`object!.property ?? other!;`,
		`getValue() ?? "default";`,
		`getValue() ?? other!;`,
		`(value ?? other)!;`,
		`
let value: string;
value! ?? "";
`,
		`
let value: string;
value ?? "";
`,
		`
let value!: string;
value ?? "";
`,
		`
let value: string;
doSomething(value);
value! ?? "";
`,
		`
let value: string;
value! ?? "";
value = getValue();
`,
		`
let value: string;
doSomething(value);
value! ?? "";
value = getValue();
`,
		`
let value = getValue();
value ?? "";
`,
		`
function test() {
    let value: string;
    return value ?? "";
}
`,
		`
let value: string;
function test() {
    return value ?? "";
}
`,
	],
});
