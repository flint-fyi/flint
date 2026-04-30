import rule from "./anyCalls.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: any;
value();
`,
			snapshot: `
declare const value: any;
value();
~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value.property();
`,
			snapshot: `
declare const value: any;
value.property();
~~~~~~~~~~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value.property.nested();
`,
			snapshot: `
declare const value: any;
value.property.nested();
~~~~~~~~~~~~~~~~~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value["property"]();
`,
			snapshot: `
declare const value: any;
value["property"]();
~~~~~~~~~~~~~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
new value();
`,
			snapshot: `
declare const value: any;
new value();
    ~~~~~
    Unsafe construction of \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value\`template\`;
`,
			snapshot: `
declare const value: any;
value\`template\`;
~~~~~
Unsafe use of \`any\` typed template tag.
`,
		},
		{
			code: `
declare const value: Function;
value();
`,
			snapshot: `
declare const value: Function;
value();
~~~~~
Unsafe call of \`Function\` typed value.
`,
		},
		{
			code: `
declare const value: Function;
new value();
`,
			snapshot: `
declare const value: Function;
new value();
    ~~~~~
    Unsafe construction of \`Function\` typed value.
`,
		},
		{
			code: `
declare const value: Function;
value\`template\`;
`,
			snapshot: `
declare const value: Function;
value\`template\`;
~~~~~
Unsafe use of \`Function\` typed template tag.
`,
		},
		{
			code: `
interface UnsafeFunction extends Function {}
declare const value: UnsafeFunction;
value();
`,
			snapshot: `
interface UnsafeFunction extends Function {}
declare const value: UnsafeFunction;
value();
~~~~~
Unsafe call of \`Function\` typed value.
`,
		},
		{
			code: `
const createValue = () => Math as any;
createValue()();
`,
			snapshot: `
const createValue = () => Math as any;
createValue()();
~~~~~~~~~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const value: unknown;
if (typeof value === "function") {
    value();
}
`,
			snapshot: `
declare const value: unknown;
if (typeof value === "function") {
    value();
    ~~~~~
    Unsafe call of \`Function\` typed value.
}
`,
		},
		{
			code: `
declare const value: any;
value?.();
`,
			snapshot: `
declare const value: any;
value?.();
~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value.a.b.c.d.e.f.g?.();
`,
			snapshot: `
declare const value: any;
value.a.b.c.d.e.f.g?.();
~~~~~~~~~~~~~~~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { a: any };
obj.a();
`,
			snapshot: `
declare const obj: { a: any };
obj.a();
~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { a: any } | undefined;
obj?.a();
`,
			snapshot: `
declare const obj: { a: any } | undefined;
obj?.a();
~~~~~~
Unsafe call of \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { tag: any };
obj.tag\`template\`;
`,
			snapshot: `
declare const obj: { tag: any };
obj.tag\`template\`;
~~~~~~~
Unsafe use of \`any\` typed template tag.
`,
		},
		{
			code: `
declare const obj: { Ctor: any };
new obj.Ctor();
`,
			snapshot: `
declare const obj: { Ctor: any };
new obj.Ctor();
    ~~~~~~~~
    Unsafe construction of \`any\` typed value.
`,
		},
		{
			code: `
interface UnsafeFunction extends Function {}
declare const value: UnsafeFunction;
new value();
`,
			snapshot: `
interface UnsafeFunction extends Function {}
declare const value: UnsafeFunction;
new value();
    ~~~~~
    Unsafe construction of \`Function\` typed value.
`,
		},
		{
			code: `
interface UnsafeFunction extends Function {}
declare const value: UnsafeFunction;
value\`template\`;
`,
			snapshot: `
interface UnsafeFunction extends Function {}
declare const value: UnsafeFunction;
value\`template\`;
~~~~~
Unsafe use of \`Function\` typed template tag.
`,
		},
		{
			code: `
interface UnsafeToConstruct extends Function {
    (): void;
}
declare const value: UnsafeToConstruct;
new value();
`,
			snapshot: `
interface UnsafeToConstruct extends Function {
    (): void;
}
declare const value: UnsafeToConstruct;
new value();
    ~~~~~
    Unsafe construction of \`Function\` typed value.
`,
		},
		{
			code: `
interface StillUnsafe extends Function {
    property: string;
}
declare const value: StillUnsafe;
value();
`,
			snapshot: `
interface StillUnsafe extends Function {
    property: string;
}
declare const value: StillUnsafe;
value();
~~~~~
Unsafe call of \`Function\` typed value.
`,
		},
	],
	valid: [
		`
declare function value(): void;
value();
`,
		`
declare const value: () => void;
value();
`,
		`
declare const object: { method(): void };
object.method();
`,
		`
declare class Constructor {}
new Constructor();
`,
		`
const tag = (strings: TemplateStringsArray, ...values: unknown[]) => strings[0];
tag\`template\`;
`,

		`
interface SafeFunction extends Function {
    (): void;
}
declare const value: SafeFunction;
value();
`,
		`
type Constructable = new () => object;
declare const value: Constructable;
new value();
`,
		`
declare const map: Map<string, number>;
map.get("key");
`,
		`(() => {})();`,
		`new Map<string, string>();`,
		`
interface Callable extends Function {
    new (): object;
}
declare const value: Callable;
new value();
`,
		`
declare const obj: { a?: () => void };
obj.a?.();
`,
		`String.raw\`template\`;`,
		`new Function('return 1');`,
		`Function('return 1');`,
		`const x = import('./foo');`,
		`const mod = await import("./module");`,
		`import("./dynamic-" + path);`,
		`import(\`./\${moduleName}\`);`,
		`
let value: NotKnown;
value();
`,
		`
let value: NotKnown;
value\`template\`;
`,
		`
let value: NotKnown;
new value();
`,
		`
declare const visitors: Record<string, ((node: unknown) => void) | undefined>;
declare const key: string;
visitors[key]?.();
`,
		`
declare const obj: { [k: string]: unknown };
obj["method"]?.();
`,
		`
{
    type Function = () => void;
    const notGlobalFunction: Function = (() => {}) as Function;
    notGlobalFunction();
}
`,
		`
interface SafeFunction extends Function {
    (): string;
}
declare const safe: SafeFunction;
safe();
`,
		`
interface ConstructSignatureMakesSafe extends Function {
    new (): ConstructSignatureMakesSafe;
}
declare const safe: ConstructSignatureMakesSafe;
new safe();
`,
		`
interface SafeWithNonVoidCallSignature extends Function {
    (): void;
    (x: string): string;
}
declare const safe: SafeWithNonVoidCallSignature;
new safe();
`,
		`
interface SafeTemplateTag extends Function {
    (strings: TemplateStringsArray): string;
}
declare const tag: SafeTemplateTag;
tag\`template\`;
`,
	],
});
