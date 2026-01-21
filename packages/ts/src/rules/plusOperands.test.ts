import rule from "./plusOperands.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		// String + Number
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
               Operands of '+' operations must be both numbers or both strings. Got \`string\` + \`number\`.
`,
		},
		// Number + String
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
               Operands of '+' operations must be both numbers or both strings. Got \`number\` + \`string\`.
`,
		},
		// BigInt + Number
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
		// Number + BigInt
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
		// Boolean + Number
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
               Operands of '+' operations must be both numbers or both strings. Got \`boolean\` + \`number\`.
`,
		},
		// Boolean + String
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
               Operands of '+' operations must be both numbers or both strings. Got \`boolean\` + \`string\`.
`,
		},
		// Boolean + Boolean
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
		// Null + Number
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
               Operands of '+' operations must be both numbers or both strings. Got \`null\` + \`number\`.
`,
		},
		// Undefined + String
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
               Operands of '+' operations must be both numbers or both strings. Got \`undefined\` + \`string\`.
`,
		},
		// Symbol + Number
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
		// Object + Number
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
		// Array + String
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
		// Function return type mismatch
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
               Operands of '+' operations must be both numbers or both strings. Got \`string\` + \`number\`.
`,
		},
		// Compound assignment += with mismatched types
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
		// Compound assignment with invalid type
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
       Invalid operand for a '+' operation. Operands must each be a number or string. Got \`unique symbol\`.
`,
		},
		// RegExp + Number
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
               ~~~~~~~~~~~
               Operands of '+' operations must be both numbers or both strings. Got \`RegExp\` + \`number\`.
`,
		},
		// Unknown type
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
	               Invalid operand for a '+' operation. Operands must each be a number or string. Got \`unknown\`.
}
`,
		},
		// Never type
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
	               Invalid operand for a '+' operation. Operands must each be a number or string. Got \`never\`.
}
`,
		},
		// Any type operand
		{
			code: `
declare const value: any;
const result = value + 5;
`,
			snapshot: `
declare const value: any;
const result = value + 5;
               ~~~~~
               Invalid operand for a '+' operation. Operands must each be a number or string. Got \`any\`.
`,
		},
		// Template literal type + number
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
		// Number + Number
		`
const a = 5;
const b = 10;
const result = a + b;
`,
		// Generic extends number
		`
function add<T extends number>(a: T, b: T): T {
	return a + b as T;
}
`,
		// Generic extends string
		`
function concat<T extends string>(a: T, b: T): string {
	return a + b;
}
`,
		// Const enum values
		`
const enum Numbers {
	One = 1,
	Two = 2,
}
const result = Numbers.One + Numbers.Two;
`,
		// Type assertion to number
		`
const a = 5 as number;
const b = 10 as number;
const result = a + b;
`,
		// Intersection with number
		`
type NumericBrand = number & { __brand: "numeric" };
declare const a: NumericBrand;
declare const b: NumericBrand;
const result = a + b;
`,
		// String + String
		`
const a = "hello";
const b = " world";
const result = a + b;
`,
		// BigInt + BigInt
		`
const a = 5n;
const b = 10n;
const result = a + b;
`,
		// Numeric literals
		`const result = 5 + 10;`,
		// String literals
		`const result = "hello" + " world";`,
		// BigInt literals
		`const result = 5n + 10n;`,
		// Function returning number + number
		`
function getNumber(): number { return 5; }
const result = getNumber() + 10;
`,
		// Function returning string + string
		`
function getString(): string { return "hello"; }
const result = getString() + " world";
`,
		// Compound assignment with matching types
		`
let num = 5;
num += 10;
`,
		// Compound assignment with string
		`
let str = "hello";
str += " world";
`,
		// Compound assignment with bigint
		`
let bigint = 5n;
bigint += 10n;
`,
		// Number union type (all numbers)
		`
function getNum(): 1 | 2 | 3 { return 1; }
const result = getNum() + 5;
`,
		// String union type (all strings)
		`
function getStr(): "a" | "b" | "c" { return "a"; }
const result = getStr() + "d";
`,
		// Template expressions with string concatenation
		`
const name = "world";
const result = "hello " + name;
`,
	],
});
