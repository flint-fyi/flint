import rule from "./explicitAnys.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value: any = 1;
`,
			snapshot: `
const value: any = 1;
             ~~~
             Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
const value: unknown = 1;
`,
				},
				{
					id: "never",
					updated: `
const value: never = 1;
`,
				},
			],
		},
		{
			code: `
function process(input: any): void {}
`,
			snapshot: `
function process(input: any): void {}
                        ~~~
                        Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
function process(input: unknown): void {}
`,
				},
				{
					id: "never",
					updated: `
function process(input: never): void {}
`,
				},
			],
		},
		{
			code: `
function get(): any { return null; }
`,
			snapshot: `
function get(): any { return null; }
                ~~~
                Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
function get(): unknown { return null; }
`,
				},
				{
					id: "never",
					updated: `
function get(): never { return null; }
`,
				},
			],
		},
		{
			code: `
const items: any[] = [];
`,
			snapshot: `
const items: any[] = [];
             ~~~
             Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
const items: unknown[] = [];
`,
				},
				{
					id: "never",
					updated: `
const items: never[] = [];
`,
				},
			],
		},
		{
			code: `
type Callback = (value: any) => void;
`,
			snapshot: `
type Callback = (value: any) => void;
                        ~~~
                        Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
type Callback = (value: unknown) => void;
`,
				},
				{
					id: "never",
					updated: `
type Callback = (value: never) => void;
`,
				},
			],
		},
		{
			code: `
function generic<T = any>(): T {}
`,
			snapshot: `
function generic<T = any>(): T {}
                     ~~~
                     Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
function generic<T = unknown>(): T {}
`,
				},
				{
					id: "never",
					updated: `
function generic<T = never>(): T {}
`,
				},
			],
		},
		{
			code: `
function generic(): Array<any> {}
`,
			snapshot: `
function generic(): Array<any> {}
                          ~~~
                          Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
function generic(): Array<unknown> {}
`,
				},
				{
					id: "never",
					updated: `
function generic(): Array<never> {}
`,
				},
			],
		},
		{
			code: `
class Greeter {
	message: any;
}
`,
			snapshot: `
class Greeter {
	message: any;
	         ~~~
	         Avoid using the \`any\` type as it disables type checking for the annotated value.
}
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
class Greeter {
	message: unknown;
}
`,
				},
				{
					id: "never",
					updated: `
class Greeter {
	message: never;
}
`,
				},
			],
		},
		{
			code: `
class Greeter {
	message: Array<any>;
}
`,
			snapshot: `
class Greeter {
	message: Array<any>;
	               ~~~
	               Avoid using the \`any\` type as it disables type checking for the annotated value.
}
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
class Greeter {
	message: Array<unknown>;
}
`,
				},
				{
					id: "never",
					updated: `
class Greeter {
	message: Array<never>;
}
`,
				},
			],
		},
		{
			code: `
interface Greeter {
	message: any;
}
`,
			snapshot: `
interface Greeter {
	message: any;
	         ~~~
	         Avoid using the \`any\` type as it disables type checking for the annotated value.
}
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
interface Greeter {
	message: unknown;
}
`,
				},
				{
					id: "never",
					updated: `
interface Greeter {
	message: never;
}
`,
				},
			],
		},
		{
			code: `
type obj = {
	message: any;
};
`,
			snapshot: `
type obj = {
	message: any;
	         ~~~
	         Avoid using the \`any\` type as it disables type checking for the annotated value.
};
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
type obj = {
	message: unknown;
};
`,
				},
				{
					id: "never",
					updated: `
type obj = {
	message: never;
};
`,
				},
			],
		},
		{
			code: `
type obj = {
	message: string | any;
};
`,
			snapshot: `
type obj = {
	message: string | any;
	                  ~~~
	                  Avoid using the \`any\` type as it disables type checking for the annotated value.
};
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
type obj = {
	message: string | unknown;
};
`,
				},
				{
					id: "never",
					updated: `
type obj = {
	message: string | never;
};
`,
				},
			],
		},
		{
			code: `
type obj = {
	message: string & any;
};
`,
			snapshot: `
type obj = {
	message: string & any;
	                  ~~~
	                  Avoid using the \`any\` type as it disables type checking for the annotated value.
};
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
type obj = {
	message: string & unknown;
};
`,
				},
				{
					id: "never",
					updated: `
type obj = {
	message: string & never;
};
`,
				},
			],
		},
		{
			code: `
class Derived<t = any> extends Base<any> {}
`,
			snapshot: `
class Derived<t = any> extends Base<any> {}
                  ~~~
                  Avoid using the \`any\` type as it disables type checking for the annotated value.
                                    ~~~
                                    Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
class Derived<t = unknown> extends Base<any> {}
`,
				},
				{
					id: "never",
					updated: `
class Derived<t = never> extends Base<any> {}
`,
				},
				{
					id: "unknown",
					updated: `
class Derived<t = any> extends Base<unknown> {}
`,
				},
				{
					id: "never",
					updated: `
class Derived<t = any> extends Base<never> {}
`,
				},
			],
		},
		{
			code: `
type Keys = keyof any;
`,
			snapshot: `
type Keys = keyof any;
                  ~~~
                  Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "propertyKey",
					updated: `
type Keys = PropertyKey;
`,
				},
			],
		},
		{
			code: `
function test<T extends Partial<any>>() {}
`,
			snapshot: `
function test<T extends Partial<any>>() {}
                                ~~~
                                Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
function test<T extends Partial<unknown>>() {}
`,
				},
				{
					id: "never",
					updated: `
function test<T extends Partial<never>>() {}
`,
				},
			],
		},
		{
			code: `
function test(...args: any) {}
`,
			snapshot: `
function test(...args: any) {}
                       ~~~
                       Avoid using the \`any\` type as it disables type checking for the annotated value.
`,
			suggestions: [
				{
					id: "unknown",
					updated: `
function test(...args: unknown) {}
`,
				},
				{
					id: "never",
					updated: `
function test(...args: never) {}
`,
				},
			],
		},
	],
	valid: [
		`const value: unknown = 1;`,
		`const value: string = "hello";`,
		`function process(input: unknown): void {}
`,
		`const items: string[] = [];`,
		`type Callback = (value: unknown) => void;`,
	],
});
