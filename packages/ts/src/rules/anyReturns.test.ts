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
const foo = () => Object.create(null);'
      `,
			snapshot: `
const foo = () => Object.create(null);'
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
			snapshot: `
function foo() {
  return this;
  ~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}

function bar() {
  return () => this;
               ~~~~
               Unsafe return of a value of type \`any\`.
}
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
let value: NotKnown;

function example() {
  return value;
}
      `,
			snapshot: `
let value: NotKnown;

function example() {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type error.
}
      `,
		},
		{
			code: `
declare const value: any;
async function foo() {
  return value;
}
      `,
			snapshot: `
declare const value: any;
async function foo() {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
      `,
		},
		{
			code: `
declare const value: Promise<any>;
async function foo(): Promise<number> {
  return value;
}
      `,
			snapshot: `
declare const value: Promise<any>;
async function foo(): Promise<number> {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
async function foo(arg: number) {
  return arg as Promise<any>;
}
      `,
			snapshot: `
async function foo(arg: number) {
  return arg as Promise<any>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
function foo(): Promise<any> {
  return {} as any;
}
      `,
			snapshot: `
function foo(): Promise<any> {
  return {} as any;
  ~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
      `,
		},
		{
			code: `
function foo(): Promise<object> {
  return {} as any;
}
      `,
			snapshot: `
function foo(): Promise<object> {
  return {} as any;
  ~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`any\`.
}
      `,
		},
		{
			code: `
async function foo(): Promise<object> {
  return Promise.resolve<any>({});
}
      `,
			snapshot: `
async function foo(): Promise<object> {
  return Promise.resolve<any>({});
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
async function foo(): Promise<object> {
  return Promise.resolve<Promise<Promise<any>>>({} as Promise<any>);
}
      `,
			snapshot: `
async function foo(): Promise<object> {
  return Promise.resolve<Promise<Promise<any>>>({} as Promise<any>);
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
async function foo(): Promise<object> {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
}
      `,
			snapshot: `
async function foo(): Promise<object> {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
async function foo() {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
}
      `,
			snapshot: `
async function foo() {
  return {} as Promise<Promise<Promise<Promise<any>>>>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
async function foo() {
  return {} as Promise<any> | Promise<object>;
}
      `,
			snapshot: `
async function foo() {
  return {} as Promise<any> | Promise<object>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
async function foo() {
  return {} as Promise<any | object>;
}
      `,
			snapshot: `
async function foo() {
  return {} as Promise<any | object>;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
async function foo() {
  return {} as Promise<any> & { __brand: 'any' };
}
      `,
			snapshot: `
async function foo() {
  return {} as Promise<any> & { __brand: 'any' };
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
		{
			code: `
interface Alias<T> extends Promise<any> {
  foo: 'bar';
}

declare const value: Alias<number>;
async function foo() {
  return value;
}
      `,
			snapshot: `
interface Alias<T> extends Promise<any> {
  foo: 'bar';
}

declare const value: Alias<number>;
async function foo() {
  return value;
  ~~~~~~~~~~~~~
  Unsafe return of a value of type \`Promise<any>\`.
}
      `,
		},
	],
	valid: [
		`
return 1 as any;
    `,
		`
function foo() {
  return;
}
    `,
		`
function foo() {
  return 1;
}
    `,
		`
function foo() {
  return '';
}
    `,
		`
function foo() {
  return true;
}
    `,
		// this actually types as `never[]`
		`
function foo() {
  return [];
}
    `,
		// explicit any return type is allowed, if you want to be unsafe like that
		`
function foo(): any {
  return {} as any;
}
    `,
		`
declare function foo(arg: () => any): void;
foo((): any => 'foo' as any);
    `,
		`
declare function foo(arg: null | (() => any)): void;
foo((): any => 'foo' as any);
    `,
		// explicit any array return type is allowed, if you want to be unsafe like that
		`
function foo(): any[] {
  return [] as any[];
}
    `,
		// explicit any generic return type is allowed, if you want to be unsafe like that
		`
function foo(): Set<any> {
  return new Set<any>();
}
    `,
		`
async function foo(): Promise<any> {
  return Promise.resolve({} as any);
}
    `,
		`
async function foo(): Promise<any> {
  return {} as any;
}
    `,
		`
function foo(): object {
  return Promise.resolve({} as any);
}
    `,
		// TODO - this should error, but it's hard to detect, as the type references are different
		`
function foo(): ReadonlySet<number> {
  return new Set<any>();
}
    `,
		`
function foo(): Set<number> {
  return new Set([1]);
}
    `,
		`
      type Foo<T = number> = { prop: T };
      function foo(): Foo {
        return { prop: 1 } as Foo<number>;
      }
    `,
		`
      type Foo = { prop: any };
      function foo(): Foo {
        return { prop: '' } as Foo;
      }
    `,
		// TS 3.9 changed this to be safe
		`
      function fn<T extends any>(x: T) {
        return x;
      }
    `,
		`
      function fn<T extends any>(x: T): unknown {
        return x as any;
      }
    `,
		`
      function fn<T extends any>(x: T): unknown[] {
        return x as any[];
      }
    `,
		`
      function fn<T extends any>(x: T): Set<unknown> {
        return x as Set<any>;
      }
    `,
		`
      async function fn<T extends any>(x: T): Promise<unknown> {
        return x as any;
      }
    `,
		`
      function fn<T extends any>(x: T): Promise<unknown> {
        return Promise.resolve(x as any);
      }
    `,
		// https://github.com/typescript-eslint/typescript-eslint/issues/2109
		`
      function test(): Map<string, string> {
        return new Map();
      }
    `,
		// https://github.com/typescript-eslint/typescript-eslint/issues/3549
		`
      function foo(): any {
        return [] as any[];
      }
    `,
		`
      function foo(): unknown {
        return [] as any[];
      }
    `,
		`
      declare const value: Promise<any>;
      function foo() {
        return value;
      }
    `,
		"const foo: (() => void) | undefined = () => 1;",
		`
      class Foo {
        public foo(): this {
          return this;
        }

        protected then(resolve: () => void): void {
          resolve();
        }
      }
    `,
	],
});
