import rule from "./methodSignatureStyles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		// Default style: "property" - reports method signatures
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
interface Example {
    ['f']<T extends {}>(a: T, b: T): T;
}
`,
			snapshot: `
interface Example {
    ['f']<T extends {}>(a: T, b: T): T;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Shorthand method signature is forbidden. Use a function property instead.
}
`,
			suggestions: [
				{
					id: "convertToProperty",
					updated: `
interface Example {
    ['f']: <T extends {}>(a: T, b: T) => T;
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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
    Shorthand method signature is forbidden. Use a function property instead.
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

		// Style: "method" - reports function property signatures
		{
			code: `
interface Example {
    f: (a: string) => number;
}
`,
			options: { style: "method" },
			snapshot: `
interface Example {
    f: (a: string) => number;
    ~~~~~~~~~~~~~~~~~~~~~~~~~
    Function property signature is forbidden. Use a method shorthand instead.
}
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
interface Example {
    f(a: string): number;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    ['f']: (a: boolean) => void;
}
`,
			options: { style: "method" },
			snapshot: `
interface Example {
    ['f']: (a: boolean) => void;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Function property signature is forbidden. Use a method shorthand instead.
}
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
interface Example {
    ['f'](a: boolean): void;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    f: <T>(a: T) => T;
}
`,
			options: { style: "method" },
			snapshot: `
interface Example {
    f: <T>(a: T) => T;
    ~~~~~~~~~~~~~~~~~~
    Function property signature is forbidden. Use a method shorthand instead.
}
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
interface Example {
    f<T>(a: T): T;
}
`,
				},
			],
		},
		{
			code: `
interface Example {
    ['f']: <T extends {}>(a: T, b: T) => T;
}
`,
			options: { style: "method" },
			snapshot: `
interface Example {
    ['f']: <T extends {}>(a: T, b: T) => T;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Function property signature is forbidden. Use a method shorthand instead.
}
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
interface Example {
    ['f']<T extends {}>(a: T, b: T): T;
}
`,
				},
			],
		},
		{
			code: `
type Example = { f: (a: string) => number };
`,
			options: { style: "method" },
			snapshot: `
type Example = { f: (a: string) => number };
                 ~~~~~~~~~~~~~~~~~~~~~~~~
                 Function property signature is forbidden. Use a method shorthand instead.
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
type Example = { f(a: string): number };
`,
				},
			],
		},
		{
			code: `
type Example = { ['f']?: (a: boolean) => void };
`,
			options: { style: "method" },
			snapshot: `
type Example = { ['f']?: (a: boolean) => void };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Function property signature is forbidden. Use a method shorthand instead.
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
type Example = { ['f']?(a: boolean): void };
`,
				},
			],
		},
		{
			code: `
type Example = { f?: <T>(a?: T) => T };
`,
			options: { style: "method" },
			snapshot: `
type Example = { f?: <T>(a?: T) => T };
                 ~~~~~~~~~~~~~~~~~~~
                 Function property signature is forbidden. Use a method shorthand instead.
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
type Example = { f?<T>(a?: T): T };
`,
				},
			],
		},
		{
			code: `
type Example = { readonly f: (a: string) => number };
`,
			options: { style: "method" },
			snapshot: `
type Example = { readonly f: (a: string) => number };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Function property signature is forbidden. Use a method shorthand instead.
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
type Example = { readonly f(a: string): number };
`,
				},
			],
		},
		// Delimiter preservation in method mode
		{
			code: `
interface Foo {
    semi: (arg: string) => void;
}
`,
			options: { style: "method" },
			snapshot: `
interface Foo {
    semi: (arg: string) => void;
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Function property signature is forbidden. Use a method shorthand instead.
}
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
interface Foo {
    semi(arg: string): void;
}
`,
				},
			],
		},
		{
			code: `
interface Foo {
    comma: (arg: string) => void,
}
`,
			options: { style: "method" },
			snapshot: `
interface Foo {
    comma: (arg: string) => void,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Function property signature is forbidden. Use a method shorthand instead.
}
`,
			suggestions: [
				{
					id: "convertToMethod",
					updated: `
interface Foo {
    comma(arg: string): void,
}
`,
				},
			],
		},
	],
	valid: [
		// Default style: "property" - accepts function property signatures
		`interface Example { method: () => void; }`,
		`interface Example { method: (value: string) => number; }`,
		`interface Example { method?: (value: string) => number; }`,
		`interface Example { readonly method: (value: string) => number; }`,
		`interface Example { method: <T>(value: T) => T; }`,
		`interface Example { ['f']: <T extends {}>(a: T, b: T) => T; }`,
		`type Example = { method: () => void; };`,
		`type Example = { readonly f: (a: string) => number };`,
		`type Example = { ['f']?: (a: boolean) => void };`,
		`type Example = { readonly f?: <T>(a?: T) => T };`,
		`type Example = { readonly ['f']?: <T>(a: T, b: T) => T };`,
		`interface Example { property: string; }`,
		// Getters and setters are always valid
		`interface Example { get value(): number; }`,
		`interface Example { set value(v: number); }`,
		`type Example = { get value(): number; };`,
		`type Example = { set value(v: number): void; };`,
		// Methods returning this are valid (can't be converted)
		`interface Example { getThis(): this; }`,
		`interface Example { clone(): this; }`,
		`interface Example { method(): this | undefined; }`,
		`interface Example { method(): Promise<this>; }`,
		`interface Example { method<T>(): Map<T, this>; }`,

		// Style: "method" - accepts method signatures
		{
			code: `interface Test { f(a: string): number; }`,
			options: { style: "method" },
		},
		{
			code: `interface Test { ['f'](a: boolean): void; }`,
			options: { style: "method" },
		},
		{
			code: `interface Test { f<T>(a: T): T; }`,
			options: { style: "method" },
		},
		{
			code: `interface Test { ['f']<T extends {}>(a: T, b: T): T; }`,
			options: { style: "method" },
		},
		{
			code: `type Test = { f(a: string): number };`,
			options: { style: "method" },
		},
		{
			code: `type Test = { ['f']?(a: boolean): void };`,
			options: { style: "method" },
		},
		{
			code: `type Test = { f?<T>(a?: T): T };`,
			options: { style: "method" },
		},
		{
			code: `type Test = { ['f']?<T>(a: T, b: T): T };`,
			options: { style: "method" },
		},
		// Getters/setters valid in method mode too
		{
			code: `interface Test { get f(): number; }`,
			options: { style: "method" },
		},
		{
			code: `interface Test { set f(value: number): void; }`,
			options: { style: "method" },
		},
		{
			code: `type Test = { get f(): number };`,
			options: { style: "method" },
		},
		{
			code: `type Test = { set f(value: number): void };`,
			options: { style: "method" },
		},
		// Non-function properties should not be reported in method mode
		{
			code: `interface Test { prop: string; }`,
			options: { style: "method" },
		},
		{
			code: `interface Test { prop: number[]; }`,
			options: { style: "method" },
		},
	],
});
