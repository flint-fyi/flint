import rule from "./indexedObjectTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
interface Foo { [key: string]: any; }
`,
			snapshot: `
interface Foo { [key: string]: any; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Foo = { [key: string]: any };
`,
			snapshot: `
type Foo = { [key: string]: any };
           ~~~~~~~~~~~~~~~~~~~~~~
           Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface StringMap { [key: string]: string; }
`,
			snapshot: `
interface StringMap { [key: string]: string; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type NumberMap = { [index: number]: boolean };
`,
			snapshot: `
type NumberMap = { [index: number]: boolean };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface ReadonlyData { readonly [key: string]: number; }
`,
			snapshot: `
interface ReadonlyData { readonly [key: string]: number; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
function process(data: { [key: string]: number }): void {}
`,
			snapshot: `
function process(data: { [key: string]: number }): void {}
                       ~~~~~~~~~~~~~~~~~~~~~~~~~
                       Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Foo = Generic<{ [key: string]: any }>;
`,
			snapshot: `
type Foo = Generic<{ [key: string]: any }>;
                   ~~~~~~~~~~~~~~~~~~~~~~
                   Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Foo = Generic<{ readonly [key: string]: any }>;
`,
			snapshot: `
type Foo = Generic<{ readonly [key: string]: any }>;
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                   Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
function foo(arg: { [key: string]: any }) {}
`,
			snapshot: `
function foo(arg: { [key: string]: any }) {}
                  ~~~~~~~~~~~~~~~~~~~~~~
                  Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
function foo(): { [key: string]: any } {}
`,
			snapshot: `
function foo(): { [key: string]: any } {}
                ~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
function foo(arg: { readonly [key: string]: any }) {}
`,
			snapshot: `
function foo(arg: { readonly [key: string]: any }) {}
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                  Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
function foo(): { readonly [key: string]: any } {}
`,
			snapshot: `
function foo(): { readonly [key: string]: any } {}
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Foo = { [k: string]: A.Foo };
`,
			snapshot: `
type Foo = { [k: string]: A.Foo };
           ~~~~~~~~~~~~~~~~~~~~~~
           Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Foo = { [key: string]: AnotherFoo };
`,
			snapshot: `
type Foo = { [key: string]: AnotherFoo };
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Foo = { [key: string]: string } | Foo;
`,
			snapshot: `
type Foo = { [key: string]: string } | Foo;
           ~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface Foo { [k: string]: A.Foo; }
`,
			snapshot: `
interface Foo { [k: string]: A.Foo; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface Foo { [key: string]: { foo: Foo }; }
`,
			snapshot: `
interface Foo { [key: string]: { foo: Foo }; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface Foo { [key: string]: Foo[]; }
`,
			snapshot: `
interface Foo { [key: string]: Foo[]; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface Foo { [key: string]: () => Foo; }
`,
			snapshot: `
interface Foo { [key: string]: () => Foo; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface Foo { [s: string]: [Foo]; }
`,
			snapshot: `
interface Foo { [s: string]: [Foo]; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Data = Record<string, number>;
`,
			options: { style: "index-signature" },
			snapshot: `
type Data = Record<string, number>;
            ~~~~~~~~~~~~~~~~~~~~~~
            Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
const values: Record<string, boolean> = {};
`,
			options: { style: "index-signature" },
			snapshot: `
const values: Record<string, boolean> = {};
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
function process(data: Record<number, string>): void {}
`,
			options: { style: "index-signature" },
			snapshot: `
function process(data: Record<number, string>): void {}
                       ~~~~~~~~~~~~~~~~~~~~~~
                       Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
type Foo = Record<symbol, any>;
`,
			options: { style: "index-signature" },
			snapshot: `
type Foo = Record<symbol, any>;
           ~~~~~~~~~~~~~~~~~~~
           Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
type Foo = Generic<Record<string, any>>;
`,
			options: { style: "index-signature" },
			snapshot: `
type Foo = Generic<Record<string, any>>;
                   ~~~~~~~~~~~~~~~~~~~
                   Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
type Foo = Record<string | number, any>;
`,
			options: { style: "index-signature" },
			snapshot: `
type Foo = Record<string | number, any>;
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
type Foo = Record<Exclude<'a' | 'b' | 'c', 'a'>, any>;
`,
			options: { style: "index-signature" },
			snapshot: `
type Foo = Record<Exclude<'a' | 'b' | 'c', 'a'>, any>;
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer an index signature over \`Record<K, V>\`.
`,
		},
	],
	valid: [
		`type Foo = Record<string, any>;`,
		`type Data = Record<string, number>;`,
		`const values: Record<string, boolean> = {};`,
		`function process(data: Record<number, string>): void {}`,

		`interface Foo {}`,
		`interface Foo { bar: string; }`,
		`interface Foo { bar: string; [key: string]: any; }`,
		`interface Foo { [key: string]: any; bar: string; }`,

		`type Foo = {};`,
		`type Foo = { bar: string; [key: string]: any; };`,
		`type Foo = { bar: string; };`,
		`type Foo = { [key: string]: any; bar: string; };`,

		`type Foo = Generic<{ [key: string]: any; bar: string; }>;`,
		`function foo(arg: { [key: string]: any; bar: string }) {}`,
		`function foo(): { [key: string]: any; bar: string } {}`,

		`type Foo = { [key: string] };`,
		`type Foo = { [] };`,
		`interface Foo { [key: string]; }`,
		`interface Foo { []; }`,

		`
interface Extended extends Base {
    [key: string]: number;
}
`,

		`type Foo = { [key: string]: string | Foo };`,
		`type Foo = { [key: string]: Foo };`,
		`type Foo = { [key: string]: Foo } | Foo;`,
		`type Foo = { [key in string]: Foo };`,
		`interface Foo { [key: string]: Foo; }`,
		`interface Foo<T> { [key: string]: Foo<T>; }`,
		`interface Foo<T> { [key: string]: Foo<T> | string; }`,
		`interface Foo { [s: string]: Foo & {}; }`,
		`interface Foo { [s: string]: Foo | string; }`,
		`interface Foo<T> { [s: string]: Foo<T> extends T ? string : number; }`,
		`interface Foo<T> { [s: string]: T extends Foo<T> ? string : number; }`,
		`interface Foo<T> { [s: string]: T extends true ? Foo<T> : number; }`,
		`interface Foo<T> { [s: string]: T extends true ? string : Foo<T>; }`,
		`interface Foo { [s: string]: Foo[number]; }`,
		`interface Foo { [s: string]: {}[Foo]; }`,

		`type Mapped = { [K in keyof T]: T[K] };`,
		`type T = { [key in Foo]: key | number };`,
		`function foo(e: { readonly [key in PropertyKey]-?: key }) {}`,
		`function f(): { [k in keyof ParseResult]: unknown; } { return {}; }`,

		{
			code: `type Foo = Misc<string, unknown>;`,
			options: { style: "index-signature" },
		},
		{
			code: `type Foo = Record;`,
			options: { style: "index-signature" },
		},
		{
			code: `type Foo = Record<string>;`,
			options: { style: "index-signature" },
		},
		{
			code: `type Foo = Record<string, number, unknown>;`,
			options: { style: "index-signature" },
		},
		{
			code: `interface Data { [key: string]: number; }`,
			options: { style: "index-signature" },
		},
		{
			code: `type Data = { [key: string]: number };`,
			options: { style: "index-signature" },
		},
		{
			code: `type Foo = { [key: string]: any };`,
			options: { style: "index-signature" },
		},
		{
			code: `type Foo = Generic<{ [key: string]: any }>;`,
			options: { style: "index-signature" },
		},
		{
			code: `function foo(arg: { [key: string]: any }) {}`,
			options: { style: "index-signature" },
		},
		{
			code: `function foo(): { [key: string]: any } {}`,
			options: { style: "index-signature" },
		},
		{
			code: `type T = A.B;`,
			options: { style: "index-signature" },
		},
		`
type Record<K, V> = { custom: true };
const data: Record<string, number> = { custom: true };
export {};
`,
	],
});
