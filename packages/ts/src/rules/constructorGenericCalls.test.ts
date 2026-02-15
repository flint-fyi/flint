import rule from "./constructorGenericCalls.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value: Map<string, number> = new Map();
`,
			output: `
const value: Map = new Map<string, number>();
`,
			snapshot: `
const value: Map<string, number> = new Map();
                ~~~~~~~~~~~~~~~~
                Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
// comment with < and >
const value: Map<string, number> = new Map();
`,
			output: `
// comment with < and >
const value: Map = new Map<string, number>();
`,
			snapshot: `
// comment with < and >
const value: Map<string, number> = new Map();
                ~~~~~~~~~~~~~~~~
                Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
const value: Map<string, number> = new Map(); // a < b > c
`,
			output: `
const value: Map = new Map<string, number>(); // a < b > c
`,
			snapshot: `
const value: Map<string, number> = new Map(); // a < b > c
                ~~~~~~~~~~~~~~~~
                Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
const value: Set<string> = new Set();
`,
			output: `
const value: Set = new Set<string>();
`,
			snapshot: `
const value: Set<string> = new Set();
                ~~~~~~~~
                Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
const value: Array<number> = new Array();
`,
			output: `
const value: Array = new Array<number>();
`,
			snapshot: `
const value: Array<number> = new Array();
                  ~~~~~~~~
                  Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
const value: Promise<string> = new Promise((resolve) => resolve("test"));
`,
			output: `
const value: Promise = new Promise<string>((resolve) => resolve("test"));
`,
			snapshot: `
const value: Promise<string> = new Promise((resolve) => resolve("test"));
                    ~~~~~~~~
                    Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
const value: MyClass<T, U> = new MyClass();
`,
			output: `
const value: MyClass = new MyClass<T, U>();
`,
			snapshot: `
const value: MyClass<T, U> = new MyClass();
                    ~~~~~~
                    Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
class Example {
    property: Map<string, number> = new Map();
}
`,
			output: `
class Example {
    property: Map = new Map<string, number>();
}
`,
			snapshot: `
class Example {
    property: Map<string, number> = new Map();
                 ~~~~~~~~~~~~~~~~
                 Prefer specifying the type argument on the constructor call instead of the type annotation.
}
`,
		},
		{
			code: `
const value: Foo<string> = new Foo;
`,
			output: `
const value: Foo = new Foo<string>();
`,
			snapshot: `
const value: Foo<string> = new Foo;
                ~~~~~~~~
                Prefer specifying the type argument on the constructor call instead of the type annotation.
`,
		},
		{
			code: `
const value = new Map<string, number>();
`,
			options: { style: "type-annotation" },
			output: `
const value: Map<string, number> = new Map();
`,
			snapshot: `
const value = new Map<string, number>();
                     ~~~~~~~~~~~~~~~~
                     Prefer specifying the type argument on the type annotation instead of the constructor call.
`,
		},
		{
			code: `
// comment with < and >
const value = new Map<string, number>();
`,
			options: { style: "type-annotation" },
			output: `
// comment with < and >
const value: Map<string, number> = new Map();
`,
			snapshot: `
// comment with < and >
const value = new Map<string, number>();
                     ~~~~~~~~~~~~~~~~
                     Prefer specifying the type argument on the type annotation instead of the constructor call.
`,
		},
		{
			code: `
const value = new Map<string, number>(); // a < b > c
`,
			options: { style: "type-annotation" },
			output: `
const value: Map<string, number> = new Map(); // a < b > c
`,
			snapshot: `
const value = new Map<string, number>(); // a < b > c
                     ~~~~~~~~~~~~~~~~
                     Prefer specifying the type argument on the type annotation instead of the constructor call.
`,
		},
		{
			code: `
const value = new Set<string>();
`,
			options: { style: "type-annotation" },
			output: `
const value: Set<string> = new Set();
`,
			snapshot: `
const value = new Set<string>();
                     ~~~~~~~~
                     Prefer specifying the type argument on the type annotation instead of the constructor call.
`,
		},
		{
			code: `
const value: Map = new Map<string, number>();
`,
			options: { style: "type-annotation" },
			output: `
const value: Map<string, number> = new Map();
`,
			snapshot: `
const value: Map = new Map<string, number>();
                          ~~~~~~~~~~~~~~~~
                          Prefer specifying the type argument on the type annotation instead of the constructor call.
`,
		},
		{
			code: `
class Example {
    property = new Map<string, number>();
}
`,
			options: { style: "type-annotation" },
			output: `
class Example {
    property: Map<string, number> = new Map();
}
`,
			snapshot: `
class Example {
    property = new Map<string, number>();
                      ~~~~~~~~~~~~~~~~
                      Prefer specifying the type argument on the type annotation instead of the constructor call.
}
`,
		},
	],
	valid: [
		`const value = new Map<string, number>(); // a < b > c`,
		`const value = new Map<string, number>();`,
		`const value: Map<string, number> = new Map<string, number>();`,
		`const value = new Map();`,
		`const value: Map = new Map();`,
		`const value: Map<string, number> = Foo();`,
		`const value: Foo<string> = new Bar<string>();`,
		`const value: Float32Array<ArrayBufferLike> = new Float32Array();`,
		`const value: Int8Array<ArrayBufferLike> = new Int8Array();`,
		`const value: Uint16Array<ArrayBufferLike> = new Uint16Array();`,
		`class Example { value = new Map<string, number>(); }`,
		`class Example { value: Map<string, number> = new Map<string, number>(); }`,

		{
			code: `const value: Map<string, number> = new Map();`,
			options: { style: "type-annotation" },
		},
		{
			code: `const value: Map<string, number> = new Map<string, number>();`,
			options: { style: "type-annotation" },
		},
		{
			code: `const value = new Map();`,
			options: { style: "type-annotation" },
		},
		{
			code: `const value: Map = new Map();`,
			options: { style: "type-annotation" },
		},
	],
});
