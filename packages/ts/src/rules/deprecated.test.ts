import rule from "./deprecated.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/** @deprecated Use newFunction instead */
function oldFunction() {}
oldFunction();
`,
			snapshot: `
/** @deprecated Use newFunction instead */
function oldFunction() {}
oldFunction();
~~~~~~~~~~~
This is deprecated.
`,
		},
		{
			code: `
class Example {
    /** @deprecated Use newMethod instead */
    oldMethod() {}

    test() {
        this.oldMethod();
    }
}
`,
			snapshot: `
class Example {
    /** @deprecated Use newMethod instead */
    oldMethod() {}

    test() {
        this.oldMethod();
             ~~~~~~~~~
             This is deprecated.
    }
}
`,
		},
		{
			code: `
/** @deprecated Use NewClass instead */
class OldClass {}
const instance = new OldClass();
`,
			snapshot: `
/** @deprecated Use NewClass instead */
class OldClass {}
const instance = new OldClass();
                     ~~~~~~~~
                     This is deprecated.
`,
		},
		{
			code: `
const obj = {
    /** @deprecated Use newProperty instead */
    oldProperty: 1
};
console.log(obj.oldProperty);
`,
			snapshot: `
const obj = {
    /** @deprecated Use newProperty instead */
    oldProperty: 1
};
console.log(obj.oldProperty);
                ~~~~~~~~~~~
                This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ var a = undefined;
a;
`,
			snapshot: `
/** @deprecated */ var a = undefined;
a;
~
This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ let a = undefined;
a;
`,
			snapshot: `
/** @deprecated */ let a = undefined;
a;
~
This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ const a = { b: 1 };
const c = a;
`,
			snapshot: `
/** @deprecated */ const a = { b: 1 };
const c = a;
          ~
          This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ const a = { b: 1 };
const { c = a } = {};
`,
			snapshot: `
/** @deprecated */ const a = { b: 1 };
const { c = a } = {};
            ~
            This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ const a = { b: 1 };
const [c = a] = [];
`,
			snapshot: `
/** @deprecated */ const a = { b: 1 };
const [c = a] = [];
           ~
           This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ const a = { b: 1 };
a.b;
`,
			snapshot: `
/** @deprecated */ const a = { b: 1 };
a.b;
~
This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ const a = { b: 1 };
a['b'];
`,
			snapshot: `
/** @deprecated */ const a = { b: 1 };
a['b'];
~
This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ const a = { b: 1 };
a?.b;
`,
			snapshot: `
/** @deprecated */ const a = { b: 1 };
a?.b;
~
This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */ const a = { b: { c: 1 } };
a.b.c;
`,
			snapshot: `
/** @deprecated */ const a = { b: { c: 1 } };
a.b.c;
~
This is deprecated.
`,
		},
		{
			code: `
const a = {
    /** @deprecated */ b: { c: 1 },
};
a.b.c;
`,
			snapshot: `
const a = {
    /** @deprecated */ b: { c: 1 },
};
a.b.c;
  ~
  This is deprecated.
`,
		},
		{
			code: `
const a = {
    /** @deprecated */ b: { c: 1 },
};
a['b']['c'];
`,
			snapshot: `
const a = {
    /** @deprecated */ b: { c: 1 },
};
a['b']['c'];
  ~~~
  This is deprecated.
`,
		},
		{
			code: `
const a = {
    /** @deprecated */ b: 1,
};
const key = 'b';
a[key];
`,
			snapshot: `
const a = {
    /** @deprecated */ b: 1,
};
const key = 'b';
a[key];
  ~~~
  This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */
class A {}
new A();
`,
			snapshot: `
/** @deprecated */
class A {}
new A();
    ~
    This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */
const A = class {};
new A();
`,
			snapshot: `
/** @deprecated */
const A = class {};
new A();
    ~
    This is deprecated.
`,
		},
		{
			code: `
const A = class {
    /** @deprecated */
    constructor() {}
};
new A();
`,
			snapshot: `
const A = class {
    /** @deprecated */
    constructor() {}
};
new A();
    ~
    This is deprecated.
`,
		},
		{
			code: `
declare class A {
    /** @deprecated */
    b(): string;
}
declare const a: A;
a.b;
`,
			snapshot: `
declare class A {
    /** @deprecated */
    b(): string;
}
declare const a: A;
a.b;
  ~
  This is deprecated.
`,
		},
		{
			code: `
declare class A {
    /** @deprecated */
    b(): string;
}
declare const a: A;
a.b();
`,
			snapshot: `
declare class A {
    /** @deprecated */
    b(): string;
}
declare const a: A;
a.b();
  ~
  This is deprecated.
`,
		},
		{
			code: `
declare class A {
    /** @deprecated */
    b: () => string;
}
declare const a: A;
a.b;
`,
			snapshot: `
declare class A {
    /** @deprecated */
    b: () => string;
}
declare const a: A;
a.b;
  ~
  This is deprecated.
`,
		},
		{
			code: `
declare class A {
    /** @deprecated */
    static b: string;
}
A.b;
`,
			snapshot: `
declare class A {
    /** @deprecated */
    static b: string;
}
A.b;
  ~
  This is deprecated.
`,
		},
		{
			code: `
interface A {
    /** @deprecated */
    b: string;
}
declare const a: A;
a.b;
`,
			snapshot: `
interface A {
    /** @deprecated */
    b: string;
}
declare const a: A;
a.b;
  ~
  This is deprecated.
`,
		},
		{
			code: `
type A = {
    /** @deprecated */
    b: string;
};
declare const a: A;
a.b;
`,
			snapshot: `
type A = {
    /** @deprecated */
    b: string;
};
declare const a: A;
a.b;
  ~
  This is deprecated.
`,
		},
		{
			code: `
class A {
    /** @deprecated */
    b: string;
}
declare const a: A;
const { b } = a;
`,
			snapshot: `
class A {
    /** @deprecated */
    b: string;
}
declare const a: A;
const { b } = a;
        ~
        This is deprecated.
`,
		},
		{
			code: `
namespace A {
    /** @deprecated */
    export const b = '';
}
A.b;
`,
			snapshot: `
namespace A {
    /** @deprecated */
    export const b = '';
}
A.b;
  ~
  This is deprecated.
`,
		},
		{
			code: `
namespace A {
    /** @deprecated */
    export function b() {}
}
A.b();
`,
			snapshot: `
namespace A {
    /** @deprecated */
    export function b() {}
}
A.b();
  ~
  This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */
enum A {
    a,
}
A.a;
`,
			snapshot: `
/** @deprecated */
enum A {
    a,
}
A.a;
~
This is deprecated.
`,
		},
		{
			code: `
enum A {
    /** @deprecated */
    a,
}
A.a;
`,
			snapshot: `
enum A {
    /** @deprecated */
    a,
}
A.a;
  ~
  This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */
function a() {}
a();
`,
			snapshot: `
/** @deprecated */
function a() {}
a();
~
This is deprecated.
`,
		},
		{
			code: `
function a(): void;
/** @deprecated */
function a(value: string): void;
function a(value?: string) {}
a('');
`,
			snapshot: `
function a(): void;
/** @deprecated */
function a(value: string): void;
function a(value?: string) {}
a('');
~
This is deprecated.
`,
		},
		{
			code: `
function a(
    /** @deprecated */
    b?: boolean,
) {
    return b;
}
`,
			snapshot: `
function a(
    /** @deprecated */
    b?: boolean,
) {
    return b;
           ~
           This is deprecated.
}
`,
		},
		{
			code: `
/** @deprecated */
declare function a(...args: unknown[]): string;
a\`\`;
`,
			snapshot: `
/** @deprecated */
declare function a(...args: unknown[]): string;
a\`\`;
~
This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */
export type A = string;
export type B = string;
export type C = string;
export type D = A | B | C;
`,
			snapshot: `
/** @deprecated */
export type A = string;
export type B = string;
export type C = string;
export type D = A | B | C;
                ~
                This is deprecated.
`,
		},
		{
			code: `
namespace A {
    /** @deprecated */
    export type B = string;
    export type C = string;
    export type D = string;
}
export type D = A.B | A.C | A.D;
`,
			snapshot: `
namespace A {
    /** @deprecated */
    export type B = string;
    export type C = string;
    export type D = string;
}
export type D = A.B | A.C | A.D;
                  ~
                  This is deprecated.
`,
		},
		{
			code: `
interface Props {
    /** @deprecated */
    anchor: 'foo';
}
declare const x: Props;
const { anchor = '' } = x;
`,
			snapshot: `
interface Props {
    /** @deprecated */
    anchor: 'foo';
}
declare const x: Props;
const { anchor = '' } = x;
        ~~~~~~
        This is deprecated.
`,
		},
		{
			code: `
interface Props {
    /** @deprecated */
    anchor: 'foo';
}
declare const x: { bar: Props };
const {
    bar: { anchor = '' },
} = x;
`,
			snapshot: `
interface Props {
    /** @deprecated */
    anchor: 'foo';
}
declare const x: { bar: Props };
const {
    bar: { anchor = '' },
           ~~~~~~
           This is deprecated.
} = x;
`,
		},
		{
			code: `
/** @deprecated */
interface Foo {}
class Bar implements Foo {}
`,
			snapshot: `
/** @deprecated */
interface Foo {}
class Bar implements Foo {}
                     ~~~
                     This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */
class Foo {}
export class Bar extends Foo {}
`,
			snapshot: `
/** @deprecated */
class Foo {}
export class Bar extends Foo {}
                         ~~~
                         This is deprecated.
`,
		},
		{
			code: `
class A {
    /** @deprecated */
    constructor() {}
}
class B extends A {
    constructor() {
        super();
    }
}
`,
			snapshot: `
class A {
    /** @deprecated */
    constructor() {}
}
class B extends A {
    constructor() {
        super();
        ~~~~~
        This is deprecated.
    }
}
`,
		},
		{
			code: `
/** @deprecated */
declare const test: string;
const bar = {
    test,
};
`,
			snapshot: `
/** @deprecated */
declare const test: string;
const bar = {
    test,
    ~~~~
    This is deprecated.
};
`,
		},
		{
			code: `
/** @deprecated */
declare const test: string;
const myObj = {
    prop: test,
};
`,
			snapshot: `
/** @deprecated */
declare const test: string;
const myObj = {
    prop: test,
          ~~~~
          This is deprecated.
};
`,
		},
		{
			code: `
/** @deprecated */
declare const test: string;
const myObj = {
    deep: {
        prop: test,
    },
};
`,
			snapshot: `
/** @deprecated */
declare const test: string;
const myObj = {
    deep: {
        prop: test,
              ~~~~
              This is deprecated.
    },
};
`,
		},
		{
			code: `
/** @deprecated */
function a(): object {
    return {};
}
export default a();
`,
			snapshot: `
/** @deprecated */
function a(): object {
    return {};
}
export default a();
               ~
               This is deprecated.
`,
		},
		{
			code: `
/** @deprecated */
declare function decorator(constructor: Function);
@decorator
export class Foo {}
`,
			snapshot: `
/** @deprecated */
declare function decorator(constructor: Function);
@decorator
 ~~~~~~~~~
 This is deprecated.
export class Foo {}
`,
		},
		{
			code: `
const a = {
    /** @deprecated */
    b: 'string',
};
const c = a['b'];
`,
			snapshot: `
const a = {
    /** @deprecated */
    b: 'string',
};
const c = a['b'];
            ~~~
            This is deprecated.
`,
		},
		{
			code: `
const a = {
    /** @deprecated */
    b: 'string',
};
const key = \`b\`;
const c = a[key];
`,
			snapshot: `
const a = {
    /** @deprecated */
    b: 'string',
};
const key = \`b\`;
const c = a[key];
            ~~~
            This is deprecated.
`,
		},
		{
			code: `
class A {
    /** @deprecated */
    accessor b: 1;
}
new A().b;
`,
			snapshot: `
class A {
    /** @deprecated */
    accessor b: 1;
}
new A().b;
        ~
        This is deprecated.
`,
		},
		{
			code: `
declare class A {
    /** @deprecated */
    static accessor b: string;
}
A.b;
`,
			snapshot: `
declare class A {
    /** @deprecated */
    static accessor b: string;
}
A.b;
  ~
  This is deprecated.
`,
		},
		{
			code: `
class A {
    /** @deprecated */
    #b = () => {};
    c() {
        this.#b();
    }
}
`,
			snapshot: `
class A {
    /** @deprecated */
    #b = () => {};
    c() {
        this.#b();
             ~~
             This is deprecated.
    }
}
`,
		},
		{
			code: `
enum Keys {
    B = 'b',
}
const a = {
    /** @deprecated */
    b: 'string',
};
const key = Keys.B;
const c = a[key];
`,
			snapshot: `
enum Keys {
    B = 'b',
}
const a = {
    /** @deprecated */
    b: 'string',
};
const key = Keys.B;
const c = a[key];
            ~~~
            This is deprecated.
`,
		},
		{
			code: `
declare function x(): 'b';
const a = {
    /** @deprecated */
    b: 'string',
};
const c = a[x()];
`,
			snapshot: `
declare function x(): 'b';
const a = {
    /** @deprecated */
    b: 'string',
};
const c = a[x()];
            ~~~
            This is deprecated.
`,
		},
		{
			code: `
declare const x: { y: 'b' };
const a = {
    /** @deprecated */
    b: 'string',
};
const c = a[x.y];
`,
			snapshot: `
declare const x: { y: 'b' };
const a = {
    /** @deprecated */
    b: 'string',
};
const c = a[x.y];
            ~~~
            This is deprecated.
`,
		},
		{
			code: `
const a = {
    /** @deprecated */
    [2]: 'string',
};
const c = a[2];
`,
			snapshot: `
const a = {
    /** @deprecated */
    [2]: 'string',
};
const c = a[2];
            ~
            This is deprecated.
`,
		},
	],
	valid: [
		"function active() {} active();",
		"class Active { method() { this.method(); } }",
		`/** @deprecated */
function unused() {}
function active() {}
active();`,
		`const obj = { property: 1 }; console.log(obj.property);`,
		`/** @deprecated */ var a;`,
		`/** @deprecated */ var a = 1;`,
		`/** @deprecated */ let a;`,
		`/** @deprecated */ let a = 1;`,
		`/** @deprecated */ const a = 1;`,
		`/** @deprecated */ declare var a: number;`,
		`/** @deprecated */ export var a = 1;`,
		`/** @deprecated */ export let a = 1;`,
		`/** @deprecated */ export const a = 1;`,
		`
const a = {
    b: 1,
    /** @deprecated */ c: 2,
};
a.b;
`,
		`
const a = {
    b: 1,
    /** @deprecated */ c: 2,
};
a['b'];
`,
		`
const a = {
    b: 1,
    /** @deprecated */ c: 2,
};
a['b' + 'c'];
`,
		`
const a = {
    b: 1,
    /** @deprecated */ c: 2,
};
const key = 'b';
a[key];
`,
		`
const a = {
    b: 1,
    /** @deprecated */ c: 2,
};
a?.b;
`,
		`
class A {
    b: 1;
    /** @deprecated */ c: 2;
}
new A().b;
`,
		`
function a(value: 'b' | undefined): void;
/** @deprecated */
function a(value: 'c' | undefined): void;
function a(value: string | undefined): void {
}
a('b');
`,
		`
interface Props {
    anchor: 'foo';
}
declare const x: Props;
const { anchor = '' } = x;
`,
		`
interface Props {
    anchor: 'foo';
}
declare const x: { bar: Props };
const {
    bar: { anchor = '' },
} = x;
`,
		`
const a = {
    /** @deprecated */
    b: 'string',
};
const c = a['nonExistentProperty'];
`,
		`
const a = {
    /** @deprecated */
    b: 'string',
};
function getKey() {
    return 'c';
}
const c = a[getKey()];
`,
		`
const a = {
    /** @deprecated */
    b: 'string',
};
const key = {};
const c = a[key];
`,
		`
const a = {
    /** @deprecated */
    b: 'string',
};
const key = Symbol('key');
const c = a[key];
`,
		`
namespace A {
    /** @deprecated */
    export const b = '';
    export const c = '';
}
A.c;
`,
		`
enum A {
    /** @deprecated */
    b = 'b',
    c = 'c',
}
A.c;
`,
		`
declare class A {
    /** @deprecated */
    static b: string;
    static c: string;
}
A.c;
`,
		`
namespace A {
    /** @deprecated */
    export type B = string;
    export type C = string;
    export type D = string;
}
export type D = A.C | A.D;
`,
		`function fn(/** @deprecated */ foo = 4) {}`,
		`
class Foo implements Foo {
    get bar(): number {
        return 42;
    }
    baz(): number {
        return this.bar;
    }
}
`,
	],
});
