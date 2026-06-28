import rule from "./nonNullAssertedNullishCoalesces.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = "value";
value! ?? "default";
`,
			snapshot: `
const value = "value";
value! ?? "default";
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
const value = "value";
value ?? "default";
`,
				},
			],
		},
		{
			code: `
const value = "value";
const other = "other";
value! ?? other!;
`,
			snapshot: `
const value = "value";
const other = "other";
value! ?? other!;
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
const value = "value";
const other = "other";
value ?? other!;
`,
				},
			],
		},
		{
			code: `
declare const object: { property?: string };
object.property! ?? "default";
`,
			snapshot: `
declare const object: { property?: string };
object.property! ?? "default";
~~~~~~~~~~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const object: { property?: string };
object.property ?? "default";
`,
				},
			],
		},
		{
			code: `
declare const object: { property?: string } | undefined;
object!.property! ?? "default";
`,
			snapshot: `
declare const object: { property?: string } | undefined;
object!.property! ?? "default";
~~~~~~~~~~~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare const object: { property?: string } | undefined;
object!.property ?? "default";
`,
				},
			],
		},
		{
			code: `
declare function getValue(): string | undefined;
getValue()! ?? "default";
`,
			snapshot: `
declare function getValue(): string | undefined;
getValue()! ?? "default";
~~~~~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare function getValue(): string | undefined;
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
declare function getValue(): string;
let value: string;
value = getValue();
value! ?? "";
`,
			snapshot: `
declare function getValue(): string;
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
declare function getValue(): string;
let value: string;
value = getValue();
value ?? "";
`,
				},
			],
		},
		{
			code: `
declare function getValue(): string;
declare function other(): string;
let value: string;
value = getValue();
value! ?? "";
value = other();
`,
			snapshot: `
declare function getValue(): string;
declare function other(): string;
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
declare function getValue(): string;
declare function other(): string;
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
declare function getValue(): string;
let value = getValue();
value! ?? "";
`,
			snapshot: `
declare function getValue(): string;
let value = getValue();
value! ?? "";
~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare function getValue(): string;
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
declare function getValue(): string;
let value = getValue();
value ! ?? "";
`,
			snapshot: `
declare function getValue(): string;
let value = getValue();
value ! ?? "";
~~~~~~~
The nullish coalescing operator handles null and undefined, making this non-null assertion redundant.
`,
			suggestions: [
				{
					id: "removeNonNullAssertion",
					updated: `
declare function getValue(): string;
let value = getValue();
value ?? "";
`,
				},
			],
		},
	],
	valid: [
		`
declare const value: string | undefined;
value ?? "default";
`,
		`
declare const value: string | undefined;
declare const other: string | undefined;
value ?? other!;
`,
		`
declare const object: { property?: string };
object.property ?? "default";
`,
		`
declare const object: { property?: string };
declare const other: string | undefined;
object.property ?? other!;
`,
		`
declare const object: { property?: string } | undefined;
object!.property ?? "default";
`,
		`
declare const object: { property?: string } | undefined;
declare const other: string | undefined;
object!.property ?? other!;
`,
		`
declare function getValue(): string | undefined;
getValue() ?? "default";
`,
		`
declare function getValue(): string | undefined;
declare const other: string | undefined;
getValue() ?? other!;
`,
		`
declare const value: string | undefined;
declare const other: string | undefined;
(value ?? other)!;
`,
		`
let value: string;
value! ?? "";
`,
		`
let value = "";
value ?? "";
`,
		`
let value!: string;
value ?? "";
`,
		`
declare function doSomething(value: string): void;
declare const value: string;
doSomething(value);
value! ?? "";
`,
		`
declare function getValue(): string;
let value: string;
value! ?? "";
value = getValue();
`,
		`
declare function doSomething(value: string): void;
declare function getValue(): string;
declare let value: string;
doSomething(value);
value! ?? "";
value = getValue();
`,
		`
declare function getValue(): string;
let value = getValue();
value ?? "";
`,
		`
function test() {
    let value = "";
    return value ?? "";
}
`,
		`
declare let value: string;
function test() {
    return value ?? "";
}
`,
	],
});
