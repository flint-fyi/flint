import { ruleTester } from "./ruleTester.ts";
import rule from "./unifiedSignatures.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function f(a: number): void;
function f(b: string): void;
function f(a: number | string): void {}
`,
			snapshot: `
function f(a: number): void;
function f(b: string): void;
           ~~~~~~~~~
           These overloads can be combined into one signature taking \`number | string\`.
function f(a: number | string): void {}
`,
		},
		{
			code: `
function f(x: number): void;
function f(x: string): void;
function f(x: any): any {
  return x;
}
`,
			snapshot: `
function f(x: number): void;
function f(x: string): void;
           ~~~~~~~~~
           These overloads can be combined into one signature taking \`number | string\`.
function f(x: any): any {
  return x;
}
`,
		},
		{
			code: `
function f(x: number): void;
function f(x: string): void;
function f(x: any): any {
  return x;
}
`,
			options: { ignoreDifferentlyNamedParameters: true },
			snapshot: `
function f(x: number): void;
function f(x: string): void;
           ~~~~~~~~~
           These overloads can be combined into one signature taking \`number | string\`.
function f(x: any): any {
  return x;
}
`,
		},
		{
			code: `
function opt(xs?: number[]): void;
function opt(xs: number[], y: string): void;
function opt(...args: any[]) {}
`,
			snapshot: `
function opt(xs?: number[]): void;
function opt(xs: number[], y: string): void;
                           ~~~~~~~~~
                           These overloads can be combined into one signature with an optional parameter.
function opt(...args: any[]) {}
`,
		},
		{
			code: `
interface I {
  a0(): void;
  a0(x: string): string;
  a0(x: number): void;
}
`,
			snapshot: `
interface I {
  a0(): void;
  a0(x: string): string;
  a0(x: number): void;
     ~~~~~~~~~
     This overload and the one on line 3 can be combined into one signature with an optional parameter.
}
`,
		},
		{
			code: `
interface I {
  a0(): void;
  a0(x: string): string;
  a0(x: number): void;
}
`,
			options: { ignoreDifferentlyNamedParameters: true },
			snapshot: `
interface I {
  a0(): void;
  a0(x: string): string;
  a0(x: number): void;
     ~~~~~~~~~
     This overload and the one on line 3 can be combined into one signature with an optional parameter.
}
`,
		},
		{
			code: `
interface I {
  a1(): void;
  a1(x: number): void;
}
`,
			snapshot: `
interface I {
  a1(): void;
  a1(x: number): void;
     ~~~~~~~~~
     These overloads can be combined into one signature with an optional parameter.
}
`,
		},
		{
			code: `
interface I {
  a3(): void;
  a3(x: number, y?: number, ...z: number[]): void;
}
`,
			snapshot: `
interface I {
  a3(): void;
  a3(x: number, y?: number, ...z: number[]): void;
                            ~~~~~~~~~~~~~~
                            These overloads can be combined into one signature with a rest parameter.
}
`,
		},
		{
			code: `
interface I {
  b(): void;
  b(...x: number[]): void;
}
`,
			snapshot: `
interface I {
  b(): void;
  b(...x: number[]): void;
    ~~~~~~~~~~~~~~
    These overloads can be combined into one signature with a rest parameter.
}
`,
		},
		{
			code: `
interface I {
  c(): void;
  c(x?: number): void;
}
`,
			snapshot: `
interface I {
  c(): void;
  c(x?: number): void;
    ~~~~~~~~~~
    These overloads can be combined into one signature with an optional parameter.
}
`,
		},
		{
			code: `
interface I {
  c2(x?: number): void;
  c2(x?: string): void;
}
`,
			snapshot: `
interface I {
  c2(x?: number): void;
  c2(x?: string): void;
     ~~~~~~~~~~
     These overloads can be combined into one signature taking \`number | string\`.
}
`,
		},
		{
			code: `
interface I {
  d(x: number): void;
  d(x: string): void;
}
`,
			snapshot: `
interface I {
  d(x: number): void;
  d(x: string): void;
    ~~~~~~~~~
    These overloads can be combined into one signature taking \`number | string\`.
}
`,
		},
		{
			code: `
type T = {
  (): void;
  (x: number): void;
};
`,
			snapshot: `
type T = {
  (): void;
  (x: number): void;
   ~~~~~~~~~
   These overloads can be combined into one signature with an optional parameter.
};
`,
		},
		{
			code: `
declare class Example {
  #privateMethod(a: number): void;
  #privateMethod(a: number, b?: string): void;
}
`,
			snapshot: `
declare class Example {
  #privateMethod(a: number): void;
  #privateMethod(a: number, b?: string): void;
                            ~~~~~~~~~~
                            These overloads can be combined into one signature with an optional parameter.
}
`,
		},
		{
			code: `
declare class C {
  constructor();
  constructor(x: number);
}
`,
			snapshot: `
declare class C {
  constructor();
  constructor(x: number);
              ~~~~~~~~~
              These overloads can be combined into one signature with an optional parameter.
}
`,
		},
		{
			code: `
interface I {
  f(x: number);
  f(x: string | boolean);
}
`,
			snapshot: `
interface I {
  f(x: number);
  f(x: string | boolean);
    ~~~~~~~~~~~~~~~~~~~
    These overloads can be combined into one signature taking \`number | string | boolean\`.
}
`,
		},
		{
			code: `
interface I {
  f(x: number);
  f(x: [string, boolean]);
}
`,
			snapshot: `
interface I {
  f(x: number);
  f(x: [string, boolean]);
    ~~~~~~~~~~~~~~~~~~~~
    These overloads can be combined into one signature taking \`number | [string, boolean]\`.
}
`,
		},
		{
			code: `
interface Generic<T> {
  y(x: T[]): void;
  y(x: T): void;
}
`,
			snapshot: `
interface Generic<T> {
  y(x: T[]): void;
  y(x: T): void;
    ~~~~
    These overloads can be combined into one signature taking \`T[] | T\`.
}
`,
		},
		{
			code: `
function f<T>(x: T[]): void;
function f<T>(x: T): void;
`,
			snapshot: `
function f<T>(x: T[]): void;
function f<T>(x: T): void;
              ~~~~
              These overloads can be combined into one signature taking \`T[] | T\`.
`,
		},
		{
			code: `
function f<T extends number>(x: T[]): void;
function f<T extends number>(x: T): void;
`,
			snapshot: `
function f<T extends number>(x: T[]): void;
function f<T extends number>(x: T): void;
                             ~~~~
                             These overloads can be combined into one signature taking \`T[] | T\`.
`,
		},
		{
			code: `
abstract class Foo {
  public abstract f(x: number): void;
  public abstract f(x: string): void;
}
`,
			snapshot: `
abstract class Foo {
  public abstract f(x: number): void;
  public abstract f(x: string): void;
                    ~~~~~~~~~
                    These overloads can be combined into one signature taking \`number | string\`.
}
`,
		},
		{
			code: `
abstract class C {
  a(b: string): void;
  /**
   * @deprecate
   */
  a(b: number): void;
}
`,
			snapshot: `
abstract class C {
  a(b: string): void;
  /**
   * @deprecate
   */
  a(b: number): void;
    ~~~~~~~~~
    These overloads can be combined into one signature taking \`string | number\`.
}
`,
		},
		{
			code: `
interface Foo {
  'f'(x: string): void;
  'f'(x: number): void;
}
`,
			snapshot: `
interface Foo {
  'f'(x: string): void;
  'f'(x: number): void;
      ~~~~~~~~~
      These overloads can be combined into one signature taking \`string | number\`.
}
`,
		},
		{
			code: `
interface Foo {
  new (x: string): Foo;
  new (x: number): Foo;
}
`,
			snapshot: `
interface Foo {
  new (x: string): Foo;
  new (x: number): Foo;
       ~~~~~~~~~
       These overloads can be combined into one signature taking \`string | number\`.
}
`,
		},
		{
			code: `
enum Enum {
  Func = 'function',
}

interface IFoo {
  [Enum.Func](x: string): void;
  [Enum.Func](x: number): void;
}
`,
			snapshot: `
enum Enum {
  Func = 'function',
}

interface IFoo {
  [Enum.Func](x: string): void;
  [Enum.Func](x: number): void;
              ~~~~~~~~~
              These overloads can be combined into one signature taking \`string | number\`.
}
`,
		},
		{
			code: `
export function foo(line: number): number;
export function foo(line: number, character?: number): number;
`,
			snapshot: `
export function foo(line: number): number;
export function foo(line: number, character?: number): number;
                                  ~~~~~~~~~~~~~~~~~~
                                  These overloads can be combined into one signature with an optional parameter.
`,
		},
		{
			code: `
declare function foo(line: number): number;
export function foo(line: number, character?: number): number;
`,
			snapshot: `
declare function foo(line: number): number;
export function foo(line: number, character?: number): number;
                                  ~~~~~~~~~~~~~~~~~~
                                  These overloads can be combined into one signature with an optional parameter.
`,
		},
		{
			code: `
declare module 'foo' {
  export default function (foo: number): string[];
  export default function (foo: number, bar?: string): string[];
}
`,
			snapshot: `
declare module 'foo' {
  export default function (foo: number): string[];
  export default function (foo: number, bar?: string): string[];
                                        ~~~~~~~~~~~~
                                        These overloads can be combined into one signature with an optional parameter.
}
`,
		},
		{
			code: `
export default function (foo: number): string[];
export default function (foo: number, bar?: string): string[];
`,
			snapshot: `
export default function (foo: number): string[];
export default function (foo: number, bar?: string): string[];
                                      ~~~~~~~~~~~~
                                      These overloads can be combined into one signature with an optional parameter.
`,
		},
		{
			code: `
/**
 * @deprecate
 */
declare function f(x: string): void;
declare function f(x: number): void;
declare function f(x: boolean): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
			snapshot: `
/**
 * @deprecate
 */
declare function f(x: string): void;
declare function f(x: number): void;
declare function f(x: boolean): void;
                   ~~~~~~~~~~
                   This overload and the one on line 6 can be combined into one signature taking \`number | boolean\`.
`,
		},
		{
			code: `
/**
 * @deprecate
 */
declare function f(x: string): void;
/**
 * @deprecate
 */
declare function f(x: number): void;
declare function f(x: boolean): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
			snapshot: `
/**
 * @deprecate
 */
declare function f(x: string): void;
/**
 * @deprecate
 */
declare function f(x: number): void;
declare function f(x: boolean): void;
                   ~~~~~~~~~
                   This overload and the one on line 5 can be combined into one signature taking \`string | number\`.
declare function f(x: boolean): void;
`,
		},
		{
			code: `
declare function f(x: string): void;
/**
 * @deprecate
 */
declare function f(x: number): void;
/**
 * @deprecate
 */
declare function f(x: boolean): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
			snapshot: `
declare function f(x: string): void;
/**
 * @deprecate
 */
declare function f(x: number): void;
/**
 * @deprecate
 */
declare function f(x: boolean): void;
                   ~~~~~~~~~~
                   This overload and the one on line 6 can be combined into one signature taking \`number | boolean\`.
`,
		},
		{
			code: `
export function f(x: string): void;
/**
 * @deprecate
 */
export function f(x: number): void;
/**
 * @deprecate
 */
export function f(x: boolean): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
			snapshot: `
export function f(x: string): void;
/**
 * @deprecate
 */
export function f(x: number): void;
/**
 * @deprecate
 */
export function f(x: boolean): void;
                  ~~~~~~~~~~
                  This overload and the one on line 6 can be combined into one signature taking \`number | boolean\`.
`,
		},
		{
			code: `
/**
 * This signature does something.
 */

/**
 * This signature does something else.
 */
function f(x: number): void;

/**
 * This signature does something else.
 */
function f(x: string): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
			snapshot: `
/**
 * This signature does something.
 */

/**
 * This signature does something else.
 */
function f(x: number): void;

/**
 * This signature does something else.
 */
function f(x: string): void;
           ~~~~~~~~~
           These overloads can be combined into one signature taking \`number | string\`.
`,
		},
		{
			code: `
interface I {
  f(x: string): void;
  /**
   * @deprecate
   */
  f(x: number): void;
  /**
   * @deprecate
   */
  f(x: boolean): void;
}
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
			snapshot: `
interface I {
  f(x: string): void;
  /**
   * @deprecate
   */
  f(x: number): void;
  /**
   * @deprecate
   */
  f(x: boolean): void;
    ~~~~~~~~~~
    This overload and the one on line 7 can be combined into one signature taking \`number | boolean\`.
}
`,
		},
		{
			code: `
// a line comment
declare function f(x: number): unknown;
declare function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
			snapshot: `
// a line comment
declare function f(x: number): unknown;
declare function f(x: boolean): unknown;
                   ~~~~~~~~~~
                   These overloads can be combined into one signature taking \`number | boolean\`.
`,
		},
		{
			code: `
function f(this: {}, a: boolean): void;
function f(this: {}, a: string): void;
function f(this: {}, a: boolean | string): void {}
`,
			snapshot: `
function f(this: {}, a: boolean): void;
function f(this: {}, a: string): void;
                     ~~~~~~~~~
                     These overloads can be combined into one signature taking \`boolean | string\`.
function f(this: {}, a: boolean | string): void {}
`,
		},
		{
			code: `
function f(this: {}): void;
function f(this: {}, a: string): void;
function f(this: {}, a?: string): void {}
`,
			snapshot: `
function f(this: {}): void;
function f(this: {}, a: string): void;
                     ~~~~~~~~~
                     These overloads can be combined into one signature with an optional parameter.
function f(this: {}, a?: string): void {}
`,
		},
		{
			code: `
function f(this: string): void;
function f(this: number): void;
function f(this: string | number): void {}
`,
			snapshot: `
function f(this: string): void;
function f(this: number): void;
           ~~~~~~~~~~~~
           These overloads can be combined into one signature taking \`string | number\`.
function f(this: string | number): void {}
`,
		},
		{
			code: `
function f(this: string, a: boolean): void;
function f(this: number, a: boolean): void;
function f(this: string | number, a: boolean): void {}
`,
			snapshot: `
function f(this: string, a: boolean): void;
function f(this: number, a: boolean): void;
           ~~~~~~~~~~~~
           These overloads can be combined into one signature taking \`string | number\`.
function f(this: string | number, a: boolean): void {}
`,
		},
	],
	valid: [
		`
function g(): void;
function g(a: number, b: number): void;
function g(a?: number, b?: number): void {}
`,
		`
function rest(...xs: number[]): void;
function rest(xs: number[], y: string): void;
function rest(...args: any[]) {}
`,
		`
class C {
  constructor();
  constructor(a: number, b: number);
  constructor(a?: number, b?: number) {}

  a(): void;
  a(a: number, b: number): void;
  a(a?: number, b?: number) {}
}
`,
		`
declare class Example {
  privateMethod(a: number): void;
  #privateMethod(a: number, b?: string): void;
}
`,
		`
declare class Example {
  #privateMethod1(a: number): void;
  #privateMethod2(a: number, b?: string): void;
}
`,
		`
interface I {
  a2(): void;
  a2(x: number, y: number): void;
}
`,
		`
interface I {
  a4(): void;
  a4(x: number): number;
}
`,
		`
interface I {
  a5<T>(x: T): T;
  a5(x: number): number;
}
`,
		`
interface I {
  b2(x: string): void;
  b2(...x: number[]): void;
}
`,
		`
interface I {
  b3(...x: number[]): void;
  b3(...x: string[]): void;
}
`,
		`
interface I {
  c3(x: number): void;
  c3(x?: string): void;
}
`,
		`
interface I {
  d2(x: string, y: number): void;
  d2(x: number, y: string): void;
}
`,
		`
declare class D {
  static a();
  a(x: number);
}
`,
		`
interface Generic<T> {
  x(): void;
  x(x: T[]): void;
}
`,
		`
interface I {
  f(x1: number): void;
  f(x1: boolean, x2?: number): void;
}
`,
		`
function f<T extends number>(x: T[]): void;
function f<T extends string>(x: T): void;
`,
		`
declare function foo(n: number): number;

declare module 'hello' {
  function foo(n: number, s: string): number;
}
`,
		`
{
  function block(): number;
  function block(n: number): number;
  function block(n?: number): number {
    return 3;
  }
}
`,
		`
export interface Foo {
  bar(baz: string): number[];
  bar(): string[];
}
`,
		`
declare module 'foo' {
  export default function (foo: number): string[];
}
`,
		`
export default function (foo: number): string[];
`,
		`
function p(key: string): Promise<string | undefined>;
function p(key: string, defaultValue: string): Promise<string>;
function p(key: string, defaultValue?: string): Promise<string | undefined> {
  const obj: Record<string, string> = {};
  return obj[key] || defaultValue;
}
`,
		`
interface I {
  p<T>(x: T): Promise<T>;
  p(x: number): Promise<number>;
}
`,
		`
function rest(...xs: number[]): Promise<number[]>;
function rest(xs: number[], y: string): Promise<string>;
async function rest(...args: any[], y?: string): Promise<number[] | string> {
  return y || args;
}
`,
		`
declare class Foo {
  get bar();
  set bar(x: number);
}
`,
		`
interface Foo {
  get bar();
  set bar(x: number);
}
`,
		`
abstract class Foo {
  abstract get bar();
  abstract set bar(a: unknown);
}
`,
		{
			code: `
function f(a: number): void;
function f(b: string): void;
function f(a: number | string): void {}
`,
			options: { ignoreDifferentlyNamedParameters: true },
		},
		{
			code: `
function f(m: number): void;
function f(v: number, u: string): void;
function f(v: number, u?: string): void {}
`,
			options: { ignoreDifferentlyNamedParameters: true },
		},
		{
			code: `
function f(v: boolean): number;
function f(): string;
`,
			options: { ignoreDifferentlyNamedParameters: true },
		},
		{
			code: `
function f(v: boolean, u: boolean): number;
function f(v: boolean): string;
`,
			options: { ignoreDifferentlyNamedParameters: true },
		},
		{
			code: `
function f(v: number, u?: string): void {}
function f(v: number): void;
function f(): string;
`,
			options: { ignoreDifferentlyNamedParameters: true },
		},
		{
			code: `
function f(a: boolean, ...c: number[]): void;
function f(a: boolean, ...d: string[]): void;
function f(a: boolean, ...c: (number | string)[]): void {}
`,
			options: { ignoreDifferentlyNamedParameters: true },
		},
		{
			code: `
class C {
  constructor();
  constructor(a: number, b: number);
  constructor(c?: number, b?: number) {}

  a(): void;
  a(a: number, b: number): void;
  a(a?: number, d?: number) {}
}
`,
			options: { ignoreDifferentlyNamedParameters: true },
		},
		{
			code: `
/** @deprecated */
declare function f(x: number): unknown;
declare function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
declare function f(x: number): unknown;
/** @deprecated */
declare function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
declare function f(x: number): unknown;
/** @deprecated */ declare function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
declare function f(x: string): void;
/**
 * @async
 */
declare function f(x: boolean): void;
/**
 * @deprecate
 */
declare function f(x: number): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
/**
 * @deprecate
 */
declare function f(x: string): void;
/**
 * @async
 */
declare function f(x: boolean): void;
declare function f(x: number): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
/**
 * This signature does something.
 */
declare function f(x: number): void;

/**
 * This signature does something else.
 */
declare function f(x: string): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
/** @deprecated */
export function f(x: number): unknown;
export function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
/**
 * This signature does something.
 */

// some other comment
export function f(x: number): void;

/**
 * This signature does something else.
 */
export function f(x: string): void;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
interface I {
  /**
   * This signature does something else.
   */
  f(x: number): void;
  f(x: string): void;
}
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
/* @deprecated */
declare function f(x: number): unknown;
declare function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
/*
 * This signature does something.
 */
declare function f(x: number): unknown;
declare function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
/**
 * This signature does something.
 **/
declare function f(x: number): unknown;
declare function f(x: boolean): unknown;
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		{
			code: `
class C {
  a(b: string): void;
  /**
   * @deprecate
   */
  a(b: number): void;
}
`,
			options: { ignoreOverloadsWithDifferentJSDoc: true },
		},
		`
function f(): void;
function f(this: {}): void;
function f(this: void | {}): void {}
`,
		`
function f(a: boolean): void;
function f(this: {}, a: boolean): void;
function f(this: void | {}, a: boolean): void {}
`,
		`
function f(this: void, a: boolean): void;
function f(this: {}, a: boolean): void;
function f(this: void | {}, a: boolean): void {}
`,
	],
});
