import rule from "./methodSignatureStyles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
interface Example {
    method(): void;
}
`,
			snapshot: `
interface Example {
    method(): void;
    ~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    method: () => void;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    method(value: string): number;
}
`,
			snapshot: `
interface Example {
    method(value: string): number;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    method: (value: string) => number;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    method?(value: string): number;
}
`,
			snapshot: `
interface Example {
    method?(value: string): number;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    method?: (value: string) => number;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    readonly method(value: string): number;
}
`,
			snapshot: `
interface Example {
    readonly method(value: string): number;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    readonly method: (value: string) => number;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    method<T>(value: T): T;
}
`,
			snapshot: `
interface Example {
    method<T>(value: T): T;
    ~~~~~~~~~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    method: <T>(value: T) => T;
}
`,
				},
			],
		},
		{
			code: `
type Example = {
    method(): void;
};
`,
			snapshot: `
type Example = {
    method(): void;
    ~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
};
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
type Example = {
    method: () => void;
};
`,
				},
			],
		},
		{
			code: `
interface Example {
    method(): void,
}
`,
			snapshot: `
interface Example {
    method(): void,
    ~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    method: () => void,
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    [key: string]: unknown;
    method(): void;
}
`,
			snapshot: `
interface Example {
    [key: string]: unknown;
    method(): void;
    ~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    [key: string]: unknown;
    method: () => void;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    "complex-name"(): void;
}
`,
			snapshot: `
interface Example {
    "complex-name"(): void;
    ~~~~~~~~~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    ["complex-name"]: () => void;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    method(first: string, second: number): boolean;
}
`,
			snapshot: `
interface Example {
    method(first: string, second: number): boolean;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    method: (first: string, second: number) => boolean;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    method();
}
`,
			snapshot: `
interface Example {
    method();
    ~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    method: () => any;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    [key](): void;
}
`,
			snapshot: `
interface Example {
    [key](): void;
    ~~~~~~~~~~~~~~
    Method signature is less type-safe than function property signature.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    [key]: () => void;
}
`,
				},
			],
		},
	],
	valid: [
		`interface Example { method: () => void; }`,
		`interface Example { method: (value: string) => number; }`,
		`interface Example { method?: (value: string) => number; }`,
		`interface Example { readonly method: (value: string) => number; }`,
		`interface Example { method: <T>(value: T) => T; }`,
		`type Example = { method: () => void; };`,
		`interface Example { property: string; }`,
		`interface Example { getThis(): this; }`,
		`interface Example { clone(): this; }`,
		`interface Example { get value(): number; }`,
		`interface Example { set value(v: number); }`,
		`type Example = { get value(): number; };`,
		`type Example = { set value(v: number): void; };`,
		`interface Example { method(): this | undefined; }`,
		`interface Example { method(): Promise<this>; }`,
		`interface Example { method<T>(): Map<T, this>; }`,
	],
});
