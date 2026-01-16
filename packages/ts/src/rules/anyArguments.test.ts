import rule from "./anyArguments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: any;
declare function fn(arg: string): void;
fn(value);
`,
			snapshot: `
declare const value: any;
declare function fn(arg: string): void;
fn(value);
   ~~~~~
   Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare const values: any[];
declare function fn(arg: string): void;
fn(values[0]);
`,
			snapshot: `
declare const values: any[];
declare function fn(arg: string): void;
fn(values[0]);
   ~~~~~~~~~
   Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare const value: any;
declare function fn(a: string, b: number): void;
fn("safe", value);
`,
			snapshot: `
declare const value: any;
declare function fn(a: string, b: number): void;
fn("safe", value);
           ~~~~~
           Unsafe argument of type \`any\` assigned to parameter of type \`number\`.
`,
		},
		{
			code: `
declare const values: any[];
declare function fn(...args: string[]): void;
fn(...values);
`,
			snapshot: `
declare const values: any[];
declare function fn(...args: string[]): void;
fn(...values);
   ~~~~~~~~~
   Unsafe spread of type \`any[]\` in function call.
`,
		},
		{
			code: `
declare const value: any;
new Set<string>(value);
`,
			snapshot: `
declare const value: any;
new Set<string>(value);
                ~~~~~
                Unsafe argument of type \`any\` assigned to parameter of type \`Iterable<string> | null | undefined\`.
`,
		},
		{
			code: `
declare const a: any;
declare const b: any;
declare function fn(x: string, y: number): void;
fn(a, b);
`,
			snapshot: `
declare const a: any;
declare const b: any;
declare function fn(x: string, y: number): void;
fn(a, b);
   ~
   Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
      ~
      Unsafe argument of type \`any\` assigned to parameter of type \`number\`.
`,
		},
		{
			code: `
declare const value: any;
declare function fn(arg: string, ...rest: number[]): void;
fn("safe", value);
`,
			snapshot: `
declare const value: any;
declare function fn(arg: string, ...rest: number[]): void;
fn("safe", value);
           ~~~~~
           Unsafe argument of type \`any\` assigned to parameter of type \`number[]\`.
`,
		},
		{
			code: `
declare const a: any;
declare const b: any;
declare function fn(...rest: number[]): void;
fn(1, a, 2, b);
`,
			snapshot: `
declare const a: any;
declare const b: any;
declare function fn(...rest: number[]): void;
fn(1, a, 2, b);
      ~
      Unsafe argument of type \`any\` assigned to parameter of type \`number[]\`.
            ~
            Unsafe argument of type \`any\` assigned to parameter of type \`number[]\`.
`,
		},
		{
			code: `
declare const value: any;
declare function fn(x: string, y: number): void;
fn(...value);
`,
			snapshot: `
declare const value: any;
declare function fn(x: string, y: number): void;
fn(...value);
   ~~~~~~~~
   Unsafe spread of type \`any\` in function call.
`,
		},
		{
			code: `
declare function fn(arg: Set<string>): void;
fn(new Set<any>());
`,
			snapshot: `
declare function fn(arg: Set<string>): void;
fn(new Set<any>());
   ~~~~~~~~~~~~~~
   Unsafe argument of type \`Set<any>\` assigned to parameter of type \`Set<string>\`.
`,
		},
		{
			code: `
declare function fn(arg: Map<string, number>): void;
fn(new Map<any, number>());
`,
			snapshot: `
declare function fn(arg: Map<string, number>): void;
fn(new Map<any, number>());
   ~~~~~~~~~~~~~~~~~~~~~~
   Unsafe argument of type \`Map<any, number>\` assigned to parameter of type \`Map<string, number>\`.
`,
		},
		{
			code: `
declare function fn(arg: Map<string, number>): void;
fn(new Map<string, any>());
`,
			snapshot: `
declare function fn(arg: Map<string, number>): void;
fn(new Map<string, any>());
   ~~~~~~~~~~~~~~~~~~~~~~
   Unsafe argument of type \`Map<string, any>\` assigned to parameter of type \`Map<string, number>\`.
`,
		},
		{
			code: `
declare function fn(arg: Set<Set<string>>): void;
fn(new Set<Set<any>>());
`,
			snapshot: `
declare function fn(arg: Set<Set<string>>): void;
fn(new Set<Set<any>>());
   ~~~~~~~~~~~~~~~~~~~
   Unsafe argument of type \`Set<Set<any>>\` assigned to parameter of type \`Set<Set<string>>\`.
`,
		},
		{
			code: `
declare function fn(arg: Array<string>): void;
fn([] as Array<any>);
`,
			snapshot: `
declare function fn(arg: Array<string>): void;
fn([] as Array<any>);
   ~~~~~~~~~~~~~~~~
   Unsafe argument of type \`any[]\` assigned to parameter of type \`string[]\`.
`,
		},
		{
			code: `
declare const value: any;
declare function tag(strings: TemplateStringsArray, arg: number): void;
tag\`\${value}\`;
`,
			snapshot: `
declare const value: any;
declare function tag(strings: TemplateStringsArray, arg: number): void;
tag\`\${value}\`;
    ~~~~~~~~
    Unsafe argument of type \`any\` assigned to parameter of type \`number\`.
`,
		},
		{
			code: `
declare const a: any;
declare const b: any;
declare function tag(strings: TemplateStringsArray, x: number, y: string): void;
tag\`\${a} and \${b}\`;
`,
			snapshot: `
declare const a: any;
declare const b: any;
declare function tag(strings: TemplateStringsArray, x: number, y: string): void;
tag\`\${a} and \${b}\`;
    ~~~~
    Unsafe argument of type \`any\` assigned to parameter of type \`number\`.
             ~~~~
             Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare const value: any;
declare function tag(strings: TemplateStringsArray, x: number, y: any, z: string): void;
tag\`\${value} \${value} \${value}\`;
`,
			snapshot: `
declare const value: any;
declare function tag(strings: TemplateStringsArray, x: number, y: any, z: string): void;
tag\`\${value} \${value} \${value}\`;
    ~~~~~~~~
    Unsafe argument of type \`any\` assigned to parameter of type \`number\`.
                      ~~~~~~~~
                      Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare function fn(x: string, y: number): void;
const tuple = ['a', 1 as any] as const;
fn(...tuple);
`,
			snapshot: `
declare function fn(x: string, y: number): void;
const tuple = ['a', 1 as any] as const;
fn(...tuple);
   ~~~~~~~~
   Unsafe spread of tuple type. The argument is of type \`any\` assigned to parameter of type \`number\`.
`,
		},
		{
			code: `
declare function fn(x: string, y: number): void;
const tuple = [1 as any, 2] as const;
fn(...tuple);
`,
			snapshot: `
declare function fn(x: string, y: number): void;
const tuple = [1 as any, 2] as const;
fn(...tuple);
   ~~~~~~~~
   Unsafe spread of tuple type. The argument is of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare const a: any;
declare const b: any;
declare function fn(...args: [number, string]): void;
fn(a, b);
`,
			snapshot: `
declare const a: any;
declare const b: any;
declare function fn(...args: [number, string]): void;
fn(a, b);
   ~
   Unsafe argument of type \`any\` assigned to parameter of type \`number\`.
      ~
      Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare const a: any;
declare const b: any;
declare const c: any;
declare function fn(...args: [number, any, string]): void;
fn(a, b, c);
`,
			snapshot: `
declare const a: any;
declare const b: any;
declare const c: any;
declare function fn(...args: [number, any, string]): void;
fn(a, b, c);
   ~
   Unsafe argument of type \`any\` assigned to parameter of type \`number\`.
         ~
         Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare const value: Promise<any>;
declare function fn(arg: Promise<string>): void;
fn(value);
`,
			snapshot: `
declare const value: Promise<any>;
declare function fn(arg: Promise<string>): void;
fn(value);
   ~~~~~
   Unsafe argument of type \`Promise<any>\` assigned to parameter of type \`Promise<string>\`.
`,
		},
		{
			code: `
declare const value: any;
class Foo {
  bar(x: string): void {}
}
const foo = new Foo();
foo.bar(value);
`,
			snapshot: `
declare const value: any;
class Foo {
  bar(x: string): void {}
}
const foo = new Foo();
foo.bar(value);
        ~~~~~
        Unsafe argument of type \`any\` assigned to parameter of type \`string\`.
`,
		},
		{
			code: `
declare const value: any;
declare function fn(arg?: string): void;
fn(value);
`,
			snapshot: `
declare const value: any;
declare function fn(arg?: string): void;
fn(value);
   ~~~~~
   Unsafe argument of type \`any\` assigned to parameter of type \`string | undefined\`.
`,
		},
	],
	valid: [
		`declare function fn(arg: string): void; fn("safe");`,
		`declare function fn(arg: number): void; fn(42);`,
		`declare function fn(arg: unknown): void; declare const x: any; fn(x);`,
		`declare function fn(arg: any): void; declare const x: any; fn(x);`,
		`declare function fn(...args: unknown[]): void; declare const x: any[]; fn(...x);`,
		`const arr = [1, 2, 3]; Math.max(...arr);`,
		`declare const obj: { name: string }; console.log(obj.name);`,
		`declare function fn(): void; fn();`,
		`declare function fn(arg: Set<string>): void; fn(new Set<string>());`,
		`declare function fn(arg: Map<string, number>): void; fn(new Map<string, number>());`,
		`declare function fn(arg: Map<string, number>): void; fn(new Map());`,
		`function fn<T extends any>(x: T, fn2: (arg: T) => void) { fn2(x); }`,
		`declare function fn(x: string, y: number): void; const t = ['a', 1] as const; fn(...t);`,
		`declare function tag(strings: TemplateStringsArray, x: number): void; tag\`\${42}\`;`,
		`declare function tag(strings: TemplateStringsArray, x: any): void; declare const v: any; tag\`\${v}\`;`,
		`declare function fn(...args: any[]): void; declare const x: any[]; fn(...x);`,
		`declare function fn(x: any, y: string): void; declare const a: any; fn(a, "safe");`,
		`new Set<string>(["a", "b"]);`,
		`new Map<string, number>([["a", 1]]);`,
		`declare function fn(...args: number[]): void; fn(1, 2, 3);`,
		`declare function fn(...args: [string, number]): void; fn("a", 1);`,
		`declare function fn(arg: Promise<string>): void; declare const p: Promise<string>; fn(p);`,
		`
declare function fn(x: any): void;
declare function fn(x: string): string;
declare const value: any;
fn(value);
		`,
	],
});
