import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./anyReturns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function foo() {
  return 1 as any;
}
      
`,
			snapshot: `
function foo() {
  return 1 as any;
  ~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
      
`,
		},
		{
			code: `
function foo() {
  return Object.create(null);
}
      
`,
			snapshot: `
function foo() {
  return Object.create(null);
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
      
`,
		},
		{
			code: `
const foo = () => {
  return 1 as any;
};
      
`,
			snapshot: `
const foo = () => {
  return 1 as any;
  ~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
};
      
`,
		},
		{
			code: `
const foo = () => Object.create(null);

`,
			snapshot: `
const foo = () => Object.create(null);
                  ~~~~~~~~~~~~~~~~~~~
                  Unsafe return of a value of type \`any\`.

`,
		},
		{
			code: `
function foo() {
  return [] as any[];
}
      
`,
			snapshot: `
function foo() {
  return [] as any[];
  ~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any[]\`.
}
      
`,
		},
		{
			code: `
function foo() {
  return [] as Array<any>;
}
      
`,
			snapshot: `
function foo() {
  return [] as Array<any>;
  ~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any[]\`.
}
      
`,
		},
		{
			code: `
function foo() {
  return [] as readonly any[];
}
      
`,
			snapshot: `
function foo() {
  return [] as readonly any[];
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any[]\`.
}
      
`,
		},
		{
			code: `
function foo() {
  return [] as Readonly<any[]>;
}
      
`,
			snapshot: `
function foo() {
  return [] as Readonly<any[]>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any[]\`.
}
      
`,
		},
		{
			code: `
const foo = () => {
  return [] as any[];
};
      
`,
			snapshot: `
const foo = () => {
  return [] as any[];
  ~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any[]\`.
};
      
`,
		},
		{
			code: `
const foo = () => [] as any[];
      
`,
			snapshot: `
const foo = () => [] as any[];
                  ~~~~~~~~~~~
                  Unsafe return of a value of type \`any[]\`.
      
`,
		},
		{
			code: `
function foo(): Set<string> {
  return new Set<any>();
}
      
`,
			snapshot: `
function foo(): Set<string> {
  return new Set<any>();
  ~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of type \`Set<any>\` from function with return type \`Set<string>\`.
}
      
`,
		},
		{
			code: `
function foo(): Map<string, string> {
  return new Map<string, any>();
}
      
`,
			snapshot: `
function foo(): Map<string, string> {
  return new Map<string, any>();
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of type \`Map<string, any>\` from function with return type \`Map<string, string>\`.
}
      
`,
		},
		{
			code: `
function foo(): Set<string[]> {
  return new Set<any[]>();
}
      
`,
			snapshot: `
function foo(): Set<string[]> {
  return new Set<any[]>();
  ~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of type \`Set<any[]>\` from function with return type \`Set<string[]>\`.
}
      
`,
		},
		{
			code: `
function foo(): Set<Set<Set<string>>> {
  return new Set<Set<Set<any>>>();
}
      
`,
			snapshot: `
function foo(): Set<Set<Set<string>>> {
  return new Set<Set<Set<any>>>();
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of type \`Set<Set<Set<any>>>\` from function with return type \`Set<Set<Set<string>>>\`.
}
      
`,
		},

		{
			code: `
type Fn = () => Set<string>;
const foo1: Fn = () => new Set<any>();
const foo2: Fn = function test() {
  return new Set<any>();
};
      
`,
			snapshot: `
type Fn = () => Set<string>;
const foo1: Fn = () => new Set<any>();
                       ~~~~~~~~~~~~~~
                       Unsafe return of type \`Set<any>\` from function with return type \`Set<string>\`.
const foo2: Fn = function test() {
  return new Set<any>();
  ~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of type \`Set<any>\` from function with return type \`Set<string>\`.
};
      
`,
		},
		{
			code: `
type Fn = () => Set<string>;
function receiver(arg: Fn) {}
receiver(() => new Set<any>());
receiver(function test() {
  return new Set<any>();
});
      
`,
			snapshot: `
type Fn = () => Set<string>;
function receiver(arg: Fn) {}
receiver(() => new Set<any>());
               ~~~~~~~~~~~~~~
               Unsafe return of type \`Set<any>\` from function with return type \`Set<string>\`.
receiver(function test() {
  return new Set<any>();
  ~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of type \`Set<any>\` from function with return type \`Set<string>\`.
});
      
`,
		},
		{
			code: `
function foo() {
  return this;
}

function bar() {
  return () => this;
}
      
`,
			files: createRuleTesterTSConfig({ noImplicitThis: false }),
			snapshot: `
function foo() {
  return this;
  ~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`. \`this\` is typed as \`any\`.
}

function bar() {
  return () => this;
               ~~~~
               Unsafe return of a value of type \`any\`. \`this\` is typed as \`any\`.
}
      
`,
		},
		{
			code: `
function foo(this: any) {
  return this;
}
void foo;
`,
			files: createRuleTesterTSConfig({ strict: undefined }),
			snapshot: `
function foo(this: any) {
  return this;
  ~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
void foo;
`,
		},
		{
			code: `
declare function foo(arg: null | (() => any)): void;
foo(() => 'foo' as any);
      
`,
			snapshot: `
declare function foo(arg: null | (() => any)): void;
foo(() => 'foo' as any);
          ~~~~~~~~~~~~
          Unsafe return of a value of type \`any\`.
      
`,
		},
		{
			code: `
declare const value: any;
async function foo() {
  return value;
}
void foo;
      
`,
			snapshot: `
declare const value: any;
async function foo() {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
void foo;
      
`,
		},
		{
			code: `
declare const value: Promise<any>;
async function foo(): Promise<number> {
  return value;
}
void foo;
      
`,
			snapshot: `
declare const value: Promise<any>;
async function foo(): Promise<number> {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo(arg: unknown) {
  return arg as Promise<any>;
}
void foo;
      
`,
			snapshot: `
async function foo(arg: unknown) {
  return arg as Promise<any>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
function foo(): Promise<any> {
  return {} as any;
}
void foo;
      
`,
			snapshot: `
function foo(): Promise<any> {
  return {} as any;
  ~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
void foo;
      
`,
		},
		{
			code: `
function foo(): Promise<object> {
  return {} as any;
}
void foo;
      
`,
			snapshot: `
function foo(): Promise<object> {
  return {} as any;
  ~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo(): Promise<object> {
  return Promise.resolve<any>({});
}
void foo;
      
`,
			snapshot: `
async function foo(): Promise<object> {
  return Promise.resolve<any>({});
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo(): Promise<object> {
  return Promise.resolve<Promise<Promise<any>>>({} as Promise<any>);
}
void foo;
      
`,
			snapshot: `
async function foo(): Promise<object> {
  return Promise.resolve<Promise<Promise<any>>>({} as Promise<any>);
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo(): Promise<object> {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
}
void foo;
      
`,
			snapshot: `
async function foo(): Promise<object> {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo() {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
}
void foo;
      
`,
			snapshot: `
async function foo() {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo() {
  return {} as Promise<any> | Promise<object>;
}
void foo;
      
`,
			snapshot: `
async function foo() {
  return {} as Promise<any> | Promise<object>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo() {
  return {} as Promise<any | object>;
}
void foo;
      
`,
			snapshot: `
async function foo() {
  return {} as Promise<any | object>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
async function foo() {
  return {} as Promise<any> & { __brand: 'any' };
}
void foo;
      
`,
			snapshot: `
async function foo() {
  return {} as Promise<any> & { __brand: 'any' };
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
interface Alias<T> extends Promise<any> {
  value?: T;
  foo: 'bar';
}

declare const value: Alias<number>;
async function foo() {
  return value;
}
void foo;
      
`,
			snapshot: `
interface Alias<T> extends Promise<any> {
  value?: T;
  foo: 'bar';
}

declare const value: Alias<number>;
async function foo() {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;
      
`,
		},
		{
			code: `
interface Thenable {
  then(onfulfilled: (value: any) => unknown): unknown;
}

declare const value: Thenable;
async function foo() {
  return value;
}
void foo;

`,
			snapshot: `
interface Thenable {
  then(onfulfilled: (value: any) => unknown): unknown;
}

declare const value: Thenable;
async function foo() {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
void foo;

`,
		},
	],
	valid: [
		`
function foo(): any {
return 1 as any;
}
void foo;
    `,
		`
function foo() {
  return;
}
void foo;
    `,
		`
function foo() {
  return 1;
}
void foo;
    `,
		`
function foo() {
  return '';
}
void foo;
    `,
		`
function foo() {
  return true;
}
void foo;
    `,
		`
function foo() {
  return [];
}
void foo;
    `,
		`
function foo(): any {
  return {} as any;
}
void foo;
    `,
		`
declare function foo(arg: () => any): void;
foo((): any => 'foo' as any);
    `,
		`
declare function foo(arg: null | (() => any)): void;
foo((): any => 'foo' as any);
    `,
		`
function foo(): any[] {
  return [] as any[];
}
void foo;
    `,
		`
function foo(): Set<any> {
  return new Set<any>();
}
void foo;
    `,
		`
async function foo(): Promise<any> {
  return Promise.resolve({} as any);
}
void foo;
    `,
		`
async function foo(): Promise<any> {
  return {} as any;
}
void foo;
    `,
		`
function foo(): object {
  return Promise.resolve({} as any);
}
void foo;
    `,
		`
function foo(): ReadonlySet<number> {
  return new Set<any>();
}
void foo;
    `,
		`
function foo(): Set<number> {
  return new Set([1]);
}
void foo;
    `,
		`
      type Foo<T = number> = { prop: T };
      function foo(): Foo {
        return { prop: 1 } as Foo<number>;
      }
      void foo;
    `,
		`
      type Foo = { prop: any };
      function foo(): Foo {
        return { prop: '' } as Foo;
      }
      void foo;
    `,
		`
      function fn<T extends any>(x: T) {
        return x;
      }
      void fn;
    `,
		`
      function fn<T extends any>(x: T): unknown {
        return x as any;
      }
      void fn;
    `,
		`
      function fn<T extends any>(x: T): unknown[] {
        return x as any[];
      }
      void fn;
    `,
		`
      function fn<T extends any>(x: T): Set<unknown> {
        return x as Set<any>;
      }
      void fn;
    `,
		`
      async function fn<T extends any>(x: T): Promise<unknown> {
        return x as any;
      }
      void fn;
    `,
		`
      function fn<T extends any>(x: T): Promise<unknown> {
        return Promise.resolve(x as any);
      }
      void fn;
    `,
		`
      function test(): Map<string, string> {
        return new Map();
      }
      void test;
    `,
		`
      function foo(): any {
        return [] as any[];
      }
      void foo;
    `,
		`
      function foo(): unknown {
        return [] as any[];
      }
      void foo;
    `,
		`
      declare const value: Promise<any>;
      function foo() {
        return value;
      }
      void foo;
    `,
		"const foo: (() => void) | undefined = () => 1; void foo;",
		{
			code: `
      class Foo {
        public foo(): this {
          return this;
        }

        protected then(resolve: () => void): void {
          resolve();
        }
      }
    `,
			files: createRuleTesterTSConfig({ noImplicitThis: false }),
		},
	],
});
