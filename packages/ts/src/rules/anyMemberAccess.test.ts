import rule from "./anyMemberAccess.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: any;
value.property;
`,
			snapshot: `
declare const value: any;
value.property;
      ~~~~~~~~
      Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value["property"];
`,
			snapshot: `
declare const value: any;
value["property"];
      ~~~~~~~~~~
      Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value.a.b.c;
`,
			snapshot: `
declare const value: any;
value.a.b.c;
      ~
      Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value[0];
`,
			snapshot: `
declare const value: any;
value[0];
      ~
      Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { a: number };
declare const key: any;
obj[key];
`,
			snapshot: `
declare const obj: { a: number };
declare const key: any;
obj[key];
    ~~~
    Computed key is \`any\` typed.
`,
		},
		{
			code: `
declare function getKey(): any;
declare const obj: { a: number };
obj[getKey()];
`,
			snapshot: `
declare function getKey(): any;
declare const obj: { a: number };
obj[getKey()];
    ~~~~~~~~
    Computed key is \`any\` typed.
`,
		},
		{
			code: `
declare const value: any;
value?.property;
`,
			snapshot: `
declare const value: any;
value?.property;
       ~~~~~~~~
       Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value.a.b.c.d.e.f.g;
`,
			snapshot: `
declare const value: any;
value.a.b.c.d.e.f.g;
      ~
      Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { a: any };
obj.a.b;
`,
			snapshot: `
declare const obj: { a: any };
obj.a.b;
      ~
      Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { nested: { prop: any } };
obj.nested.prop.value;
`,
			snapshot: `
declare const obj: { nested: { prop: any } };
obj.nested.prop.value;
                ~~~~~
                Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const arr: string[];
arr[1 as any];
`,
			snapshot: `
declare const arr: string[];
arr[1 as any];
    ~~~~~~~~
    Computed key is \`any\` typed.
`,
		},
		{
			code: `
let value: NotKnown;
value.property;
`,
			snapshot: `
let value: NotKnown;
value.property;
      ~~~~~~~~
      Unsafe member access on \`error\` typed value.
`,
		},
		{
			code: `
declare const obj: { a: number };
let key: NotKnown;
obj[key];
`,
			snapshot: `
declare const obj: { a: number };
let key: NotKnown;
obj[key];
    ~~~
    Computed key is \`error\` typed.
`,
		},
		{
			code: `
declare const value: any;
value?.[0];
`,
			snapshot: `
declare const value: any;
value?.[0];
        ~
        Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value.a[0].b;
`,
			snapshot: `
declare const value: any;
value.a[0].b;
      ~
      Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
value!.property;
`,
			snapshot: `
declare const value: any;
value!.property;
       ~~~~~~~~
       Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: any;
(value).property;
`,
			snapshot: `
declare const value: any;
(value).property;
        ~~~~~~~~
        Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare function getAny(): any;
getAny().property;
`,
			snapshot: `
declare function getAny(): any;
getAny().property;
         ~~~~~~~~
         Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const value: string;
(value as any).property;
`,
			snapshot: `
declare const value: string;
(value as any).property;
               ~~~~~~~~
               Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const arr: any;
arr[0].property;
`,
			snapshot: `
declare const arr: any;
arr[0].property;
    ~
    Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { a: number };
declare let y: any;
obj[(y += 1)];
`,
			snapshot: `
declare const obj: { a: number };
declare let y: any;
obj[(y += 1)];
    ~~~~~~~~
    Computed key is \`any\` typed.
`,
		},
		{
			code: `
declare const obj: { a: number };
declare const y: any;
obj[y()];
`,
			snapshot: `
declare const obj: { a: number };
declare const y: any;
obj[y()];
    ~~~
    Computed key is \`any\` typed.
`,
		},
		{
			code: `
declare const obj: { a: number } | undefined;
declare const key: any;
obj?.[key];
`,
			snapshot: `
declare const obj: { a: number } | undefined;
declare const key: any;
obj?.[key];
      ~~~
      Computed key is \`any\` typed.
`,
		},
		{
			code: `
declare const x: any;
x['a']['b']['c'];
`,
			snapshot: `
declare const x: any;
x['a']['b']['c'];
  ~~~
  Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const arr: string[];
declare const y: any;
arr[y];
`,
			snapshot: `
declare const arr: string[];
declare const y: any;
arr[y];
    ~
    Computed key is \`any\` typed.
`,
		},
		{
			code: `
class C {
  getObs$: any;
  run(): void {
    this.getObs$.pipe().subscribe();
  }
}
`,
			snapshot: `
class C {
  getObs$: any;
  run(): void {
    this.getObs$.pipe().subscribe();
                        ~~~~~~~~~
                        Unsafe member access on \`any\` typed value.
                 ~~~~
                 Unsafe member access on \`any\` typed value.
  }
}
`,
		},
		{
			code: `
declare const x: any;
x["prop" as const];
`,
			snapshot: `
declare const x: any;
x["prop" as const];
  ~~~~~~~~~~~~~~~
  Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare const obj: { a: number };
declare const cond: boolean;
declare const anyKey: any;
obj[cond ? anyKey : "a"];
`,
			snapshot: `
declare const obj: { a: number };
declare const cond: boolean;
declare const anyKey: any;
obj[cond ? anyKey : "a"];
    ~~~~~~~~~~~~~~~~~~~
    Computed key is \`any\` typed.
`,
		},
		{
			code: `
declare const x: any;
({ ...x }).property;
`,
			snapshot: `
declare const x: any;
({ ...x }).property;
           ~~~~~~~~
           Unsafe member access on \`any\` typed value.
`,
		},
		{
			code: `
declare function asyncAny(): Promise<any>;
async function test() {
  (await asyncAny()).property;
}
`,
			snapshot: `
declare function asyncAny(): Promise<any>;
async function test() {
  (await asyncAny()).property;
                     ~~~~~~~~
                     Unsafe member access on \`any\` typed value.
}
`,
		},
	],
	valid: [
		`
declare const value: { property: string };
value.property;
`,
		`
declare const value: { property: string };
value["property"];
`,
		`
declare const value: string[];
value[0];
`,
		`
declare const value: Record<string, number>;
value["key"];
`,
		`
declare const value: Record<string, number>;
declare const key: string;
value[key];
`,
		`
declare const value: unknown;
if (typeof value === "object" && value !== null && "property" in value) {
    (value as { property: string }).property;
}
`,
		`
declare const map: Map<string, number>;
map.get("key");
`,
		`const result = [1, 2, 3][0];`,
		`
declare const obj: { a: { b: { c: number } } };
obj.a.b.c;
`,
		`
declare const obj: { a?: { b: number } };
obj.a?.b;
`,
		`
declare const obj: { property: string } | undefined;
obj?.property;
`,
		`
declare const obj: Record<string, number>;
obj[\`key\`];
`,
		`
declare const arr: number[];
arr[42];
`,
		`
declare function getTyped(): { property: string };
getTyped().property;
`,
		`
class MyClass {
    property = "value";
}
const instance = new MyClass();
instance.property;
`,
		`
interface StringMap {
    [key: string]: number;
}
declare const map: StringMap;
declare const key: string;
map[key];
`,
		`
declare const tuple: [string, number];
tuple[0];
tuple[1];
`,
		`
function foo(x: { a: number }, y: number) {
	x[y++];
}
`,
		`
declare const obj: { [key: symbol]: number };
declare const key: symbol;
obj[key];
`,
		`
declare const sym: unique symbol;
declare const obj: { [key: typeof sym]: number };
obj[sym];
`,
		// Edge case: class implements unknown type (heritage context - type-level, not runtime)
		`class B implements FG.A {}`,
		// Edge case: interface extends unknown type (heritage context)
		`interface B extends FG.A {}`,
		// Edge case: deeply nested unknown type in heritage
		`class B implements F.S.T.A {}`,
		// Edge case: interface with deeply nested heritage
		`interface B extends F.S.T.A {}`,
	],
});
