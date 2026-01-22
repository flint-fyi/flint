import rule from "./plusOperands.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const str = "hello";
const num = 5;
const result = str + num;
`,
			snapshot: `
const str = "hello";
const num = 5;
const result = str + num;
               ~~~~~~~~~
               This non-primitive operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
const num = 5;
const str = "hello";
const result = num + str;
`,
			snapshot: `
const num = 5;
const str = "hello";
const result = num + str;
               ~~~~~~~~~
               This non-primitive operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
const bigint = 5n;
const num = 5;
const result = bigint + num;
`,
			snapshot: `
const bigint = 5n;
const num = 5;
const result = bigint + num;
               ~~~~~~~~~~~~
               Numeric '+' operations must either be both bigints or both numbers. Got \`bigint\` + \`number\`.
`,
		},
		{
			code: `
const num = 5;
const bigint = 5n;
const result = num + bigint;
`,
			snapshot: `
const num = 5;
const bigint = 5n;
const result = num + bigint;
               ~~~~~~~~~~~~
               Numeric '+' operations must either be both bigints or both numbers. Got \`number\` + \`bigint\`.
`,
		},
		{
			code: `
const bool = true;
const num = 5;
const result = bool + num;
`,
			snapshot: `
const bool = true;
const num = 5;
const result = bool + num;
               ~~~~~~~~~~
               This non-primitive operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
const bool = true;
const str = "hello";
const result = bool + str;
`,
			snapshot: `
const bool = true;
const str = "hello";
const result = bool + str;
               ~~~~~~~~~~
               This non-primitive operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
const a = true;
const b = false;
const result = a + b;
`,
			snapshot: `
const a = true;
const b = false;
const result = a + b;
               ~
               Invalid operand for a '+' operation. Operands must each be a number or string. Got \`boolean\`.
`,
		},
		{
			code: `
const n = null;
const num = 5;
const result = n + num;
`,
			snapshot: `
const n = null;
const num = 5;
const result = n + num;
               ~~~~~~~
               This non-primitive operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
const u = undefined;
const str = "hello";
const result = u + str;
`,
			snapshot: `
const u = undefined;
const str = "hello";
const result = u + str;
               ~~~~~~~
               This non-primitive operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
const sym = Symbol("test");
const num = 5;
const result = sym + num;
`,
			snapshot: `
const sym = Symbol("test");
const num = 5;
const result = sym + num;
               ~~~
               Invalid operand for a '+' operation. Operands must each be a number or string. Got \`unique symbol\`.
`,
		},
		{
			code: `
const obj = {};
const num = 5;
const result = obj + num;
`,
			snapshot: `
const obj = {};
const num = 5;
const result = obj + num;
               ~~~
               Invalid operand for a '+' operation. Operands must each be a number or string. Got \`{}\`.
`,
		},
		{
			code: `
const arr: number[] = [];
const str = "hello";
const result = arr + str;
`,
			snapshot: `
const arr: number[] = [];
const str = "hello";
const result = arr + str;
               ~~~
               Invalid operand for a '+' operation. Operands must each be a number or string. Got \`number[]\`.
`,
		},
		{
			code: `
function getString(): string { return "hello"; }
function getNumber(): number { return 5; }
const result = getString() + getNumber();
`,
			snapshot: `
function getString(): string { return "hello"; }
function getNumber(): number { return 5; }
const result = getString() + getNumber();
               ~~~~~~~~~~~~~~~~~~~~~~~~~
               This non-primitive operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
let str = "hello";
const num = 5;
str += num;
`,
			snapshot: `
let str = "hello";
const num = 5;
str += num;
~~~~~~~~~~
Operands of '+' operations must be both numbers or both strings. Got \`string\` + \`number\`.
`,
		},
		{
			code: `
let num = 5;
const sym = Symbol("test");
num += sym;
`,
			snapshot: `
let num = 5;
const sym = Symbol("test");
num += sym;
       ~~~
       This symbol operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
const regex = /test/;
const num = 5;
const result = regex + num;
`,
			snapshot: `
const regex = /test/;
const num = 5;
const result = regex + num;
               ~~~~~
               This RegExp operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
function test(value: unknown) {
	const result = value + 5;
}
`,
			snapshot: `
function test(value: unknown) {
	const result = value + 5;
	               ~~~~~
	               This \`unknown\` operand is invalid for a '+' operation. Operands must each be a numeric or string value.
}
`,
		},
		{
			code: `
function test(value: never) {
	const result = value + 5;
}
`,
			snapshot: `
function test(value: never) {
	const result = value + 5;
	               ~~~~~
	               This \`never\` operand is invalid for a '+' operation. Operands must each be a numeric or string value.
}
`,
		},
		{
			code: `
declare const value: any;
const result = value + 5;
`,
			snapshot: `
declare const value: any;
const result = value + 5;
               ~~~~~
               This \`any\` operand is invalid for a '+' operation. Operands must each be a numeric or string value.
`,
		},
		{
			code: `
type Prefix = \`prefix_\${string}\`;
declare const prefix: Prefix;
const num = 5;
const result = prefix + num;
`,
			snapshot: `
type Prefix = \`prefix_\${string}\`;
declare const prefix: Prefix;
const num = 5;
const result = prefix + num;
               ~~~~~~~~~~~~
               Operands of '+' operations must be both numbers or both strings. Got \`string\` + \`number\`.
`,
		},
	],
	valid: [
		`
const a = 5;
const b = 10;
const result = a + b;
`,
		`
function add<T extends number>(a: T, b: T): T {
	return a + b as T;
}
`,
		`
function concat<T extends string>(a: T, b: T): string {
	return a + b;
}
`,
		`
const enum Numbers {
	One = 1,
	Two = 2,
}
const result = Numbers.One + Numbers.Two;
`,
		`
const a = 5 as number;
const b = 10 as number;
const result = a + b;
`,
		`
type NumericBrand = number & { __brand: "numeric" };
declare const a: NumericBrand;
declare const b: NumericBrand;
const result = a + b;
`,
		`
const a = "hello";
const b = " world";
const result = a + b;
`,
		`
const a = 5n;
const b = 10n;
const result = a + b;
`,
		`const result = 5 + 10;`,
		`const result = "hello" + " world";`,
		`const result = 5n + 10n;`,
		`
function getNumber(): number { return 5; }
const result = getNumber() + 10;
`,
		`
function getString(): string { return "hello"; }
const result = getString() + " world";
`,
		`
let num = 5;
num += 10;
`,
		`
let str = "hello";
str += " world";
`,
		`
let bigint = 5n;
bigint += 10n;
`,
		`
function getNum(): 1 | 2 | 3 { return 1; }
const result = getNum() + 5;
`,
		`
function getStr(): "a" | "b" | "c" { return "a"; }
const result = getStr() + "d";
`,
		`
const name = "world";
const result = "hello " + name;
`,
	],
});
