import rule from "./anyAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1 as any;
`,
			snapshot: `
const value = 1 as any;
      ~~~~~~~~~~~~~~~~
      Unsafe assignment of a value of type \`any\`.
`,
		},
		{
			code: `
const value = Object.create(null);
`,
			snapshot: `
const value = Object.create(null);
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of a value of type \`any\`.
`,
		},
		{
			code: `
const values = [] as any[];
`,
			snapshot: `
const values = [] as any[];
      ~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of a value of type \`any[]\`.
`,
		},
		{
			code: `
const values = [] as Array<any>;
`,
			snapshot: `
const values = [] as Array<any>;
      ~~~~~~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of a value of type \`any[]\`.
`,
		},
		{
			code: `
const value = Promise.resolve(1 as any);
`,
			snapshot: `
const value = Promise.resolve(1 as any);
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of a value of type \`Promise<any>\`.
`,
		},
		{
			code: `
const items: string[] = [...([] as any[])];
`,
			snapshot: `
const items: string[] = [...([] as any[])];
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of type \`any[]\` to variable of type \`string[]\`.
                         ~~~~~~~~~~~~~~~~
                         Unsafe spread of type \`any[]\` into array of type \`string[]\`.
`,
		},
		{
			code: `
const [first, second] = [] as any[];
`,
			snapshot: `
const [first, second] = [] as any[];
      ~~~~~~~~~~~~~~~
      Unsafe array destructuring of a value of type \`any[]\`.
`,
		},
		{
			code: `
const value: Set<string> = new Set<any>();
`,
			snapshot: `
const value: Set<string> = new Set<any>();
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of type \`Set<any>\` to variable of type \`Set<string>\`.
`,
		},
		{
			code: `
const value: Map<string, number> = new Map<string, any>();
`,
			snapshot: `
const value: Map<string, number> = new Map<string, any>();
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of type \`Map<string, any>\` to variable of type \`Map<string, number>\`.
`,
		},
		{
			code: `
const value: Set<Set<string>> = new Set<Set<any>>();
`,
			snapshot: `
const value: Set<Set<string>> = new Set<Set<any>>();
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      Unsafe assignment of type \`Set<Set<any>>\` to variable of type \`Set<Set<string>>\`.
`,
		},
		{
			code: `
declare const anyValue: any;
const value = anyValue;
`,
			snapshot: `
declare const anyValue: any;
const value = anyValue;
      ~~~~~~~~~~~~~~~~
      Unsafe assignment of a value of type \`any\`.
`,
		},
		{
			code: `
const [x] = [1] as [any];
`,
			snapshot: `
const [x] = [1] as [any];
       ~
       Unsafe array destructuring of a tuple element with type \`any\`.
`,
		},
		{
			code: `
const [[[[x]]]] = [[[[1 as any]]]];
`,
			snapshot: `
const [[[[x]]]] = [[[[1 as any]]]];
          ~
          Unsafe array destructuring of a tuple element with type \`any\`.
`,
		},
		{
			code: `
const { x } = { x: 1 } as { x: any };
`,
			snapshot: `
const { x } = { x: 1 } as { x: any };
        ~
        Unsafe object destructuring of a property with type \`any\`.
`,
		},
		{
			code: `
const { x: y } = { x: 1 } as { x: any };
`,
			snapshot: `
const { x: y } = { x: 1 } as { x: any };
           ~
           Unsafe object destructuring of a property with type \`any\`.
`,
		},
		{
			code: `
const { x: { y } } = { x: { y: 1 } } as { x: { y: any } };
`,
			snapshot: `
const { x: { y } } = { x: { y: 1 } } as { x: { y: any } };
             ~
             Unsafe object destructuring of a property with type \`any\`.
`,
		},
		{
			code: `
const { x: [y] } = { x: { y: 1 } } as { x: [any] };
`,
			snapshot: `
const { x: [y] } = { x: { y: 1 } } as { x: [any] };
            ~
            Unsafe array destructuring of a tuple element with type \`any\`.
`,
		},
		{
			code: `
const [{ x }] = [{ x: 1 }] as [{ x: any }];
`,
			snapshot: `
const [{ x }] = [{ x: 1 }] as [{ x: any }];
         ~
         Unsafe object destructuring of a property with type \`any\`.
`,
		},
		{
			code: `
function foo(a = 1 as any) {}
`,
			snapshot: `
function foo(a = 1 as any) {}
             ~~~~~~~~~~~~
             Unsafe assignment of a value of type \`any\`.
`,
		},
		{
			code: `
function foo([x] = [1] as [any]) {}
`,
			snapshot: `
function foo([x] = [1] as [any]) {}
              ~
              Unsafe array destructuring of a tuple element with type \`any\`.
`,
		},
		{
			code: `
function foo({ x } = { x: 1 } as { x: any }) {}
`,
			snapshot: `
function foo({ x } = { x: 1 } as { x: any }) {}
               ~
               Unsafe object destructuring of a property with type \`any\`.
`,
		},
		{
			code: `
class Foo {
  private a = 1 as any;
}
`,
			snapshot: `
class Foo {
  private a = 1 as any;
  ~~~~~~~~~~~~~~~~~~~~~
  Unsafe assignment of a value of type \`any\`.
}
`,
		},
		{
			code: `
type Foo = { bar: number };
const bar: any = 1;
const foo: Foo = { bar };
`,
			snapshot: `
type Foo = { bar: number };
const bar: any = 1;
const foo: Foo = { bar };
                   ~~~
                   Unsafe assignment of a value of type \`any\`.
`,
		},
		{
			code: `
const [{ ['x']: x }] = [{ ['x']: 1 }] as [{ ['x']: any }];
`,
			snapshot: `
const [{ ['x']: x }] = [{ ['x']: 1 }] as [{ ['x']: any }];
                ~
                Unsafe object destructuring of a property with type \`any\`.
`,
		},
		{
			code: `
const [{ [\`x\`]: x }] = [{ [\`x\`]: 1 }] as [{ [\`x\`]: any }];
`,
			snapshot: `
const [{ [\`x\`]: x }] = [{ [\`x\`]: 1 }] as [{ [\`x\`]: any }];
                ~
                Unsafe object destructuring of a property with type \`any\`.
`,
		},
	],
	valid: [
		`const value = 1;`,
		`const value = "hello";`,
		`const value = true;`,
		`const value: any = 1 as any;`,
		`const value: unknown = 1 as any;`,
		`const values: any[] = [] as any[];`,
		`const value: Set<any> = new Set<any>();`,
		`const value: Set<unknown> = new Set<any>();`,
		`const items: unknown[] = [...([] as any[])];`,
		`const items: any[] = [...([] as any[])];`,
		`const value: Map<string, string> = new Map();`,
		`const value = [1, 2, 3];`,
		`const [first, second] = [1, 2];`,
		`function foo(a = 1) {}`,
		`function getValue(): any { return 1; } const value: any = getValue();`,
		`const [x, ...y] = [1, 2, 3, 4, 5];`,
		`const [x, ...y] = [1];`,
		`const [{ ...x }] = [{ x: 1 }] as [{ x: any }];`,
		`
type T = [string, T[]];
const test: T = ['string', []] as T;
`,
		`const x: unknown = 1 as any;`,
		`const x: unknown[] = [] as any[];`,
		`const x: Set<unknown> = new Set<any>();`,
		`const x: Map<string, string> = new Map();`,
		`
type Foo = { bar: unknown };
const bar: any = 1;
const foo: Foo = { bar };
`,
		`const [{ [\`x\${1}\`]: x }] = [{ [\`x\`]: 1 }] as [{ [\`x\`]: any }];`,
	],
});
