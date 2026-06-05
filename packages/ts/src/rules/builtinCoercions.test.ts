import rule from "./builtinCoercions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const toString = (value: string) => String(value);
`,
			output: `
const toString = String;
`,
			snapshot: `
const toString = (value: string) => String(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`String\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toNumber = (value: string) => Number(value);
`,
			output: `
const toNumber = Number;
`,
			snapshot: `
const toNumber = (value: string) => Number(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`Number\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toBigInt = (value: string) => BigInt(value);
`,
			output: `
const toBigInt = BigInt;
`,
			snapshot: `
const toBigInt = (value: string) => BigInt(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`BigInt\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toBoolean = (value: string) => Boolean(value);
`,
			output: `
const toBoolean = Boolean;
`,
			snapshot: `
const toBoolean = (value: string) => Boolean(value);
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                  Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toSymbol = (value: string) => Symbol(value);
`,
			output: `
const toSymbol = Symbol;
`,
			snapshot: `
const toSymbol = (value: string) => Symbol(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`Symbol\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toString = (value: string) => { return String(value); };
`,
			output: `
const toString = String;
`,
			snapshot: `
const toString = (value: string) => { return String(value); };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`String\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toString = function (value: string) { return String(value); };
`,
			output: `
const toString = String;
`,
			snapshot: `
const toString = function (value: string) { return String(value); };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`String\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const truthy = values.filter((value) => value);
`,
			output: `
const values = [1, 0, 2];
const truthy = values.filter(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const truthy = values.filter((value) => value);
                             ~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const truthy = values.filter(value => value);
`,
			output: `
const values = [1, 0, 2];
const truthy = values.filter(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const truthy = values.filter(value => value);
                             ~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const hasTruthy = values.some((item) => item);
`,
			output: `
const values = [1, 0, 2];
const hasTruthy = values.some(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const hasTruthy = values.some((item) => item);
                              ~~~~~~~~~~~~~~
                              Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const allTruthy = values.every((element) => element);
`,
			output: `
const values = [1, 0, 2];
const allTruthy = values.every(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const allTruthy = values.every((element) => element);
                               ~~~~~~~~~~~~~~~~~~~~
                               Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const firstTruthy = values.find((item) => item);
`,
			output: `
const values = [1, 0, 2];
const firstTruthy = values.find(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const firstTruthy = values.find((item) => item);
                                ~~~~~~~~~~~~~~
                                Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const lastTruthy = values.findLast((item) => item);
`,
			output: `
const values = [1, 0, 2];
const lastTruthy = values.findLast(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const lastTruthy = values.findLast((item) => item);
                                   ~~~~~~~~~~~~~~
                                   Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const firstIndex = values.findIndex((item) => item);
`,
			output: `
const values = [1, 0, 2];
const firstIndex = values.findIndex(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const firstIndex = values.findIndex((item) => item);
                                    ~~~~~~~~~~~~~~
                                    Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const lastIndex = values.findLastIndex((item) => item);
`,
			output: `
const values = [1, 0, 2];
const lastIndex = values.findLastIndex(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const lastIndex = values.findLastIndex((item) => item);
                                       ~~~~~~~~~~~~~~
                                       Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const truthy = values.filter((value) => { return value; });
`,
			output: `
const values = [1, 0, 2];
const truthy = values.filter(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const truthy = values.filter((value) => { return value; });
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const truthy = values.filter(function (value) { return value; });
`,
			output: `
const values = [1, 0, 2];
const truthy = values.filter(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const truthy = values.filter(function (value) { return value; });
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const values = [1, 0, 2];
const truthy = values.filter((value) => (value));
`,
			output: `
const values = [1, 0, 2];
const truthy = values.filter(Boolean);
`,
			snapshot: `
const values = [1, 0, 2];
const truthy = values.filter((value) => (value));
                             ~~~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
	],
	valid: [
		`
declare const value: string;
const result = String(value);
`,
		`
declare const value: string;
const result = Number(value);
`,
		`
declare const value: string;
const result = Boolean(value);
`,
		`
const values = [1, 0, 2];
const result = values.filter(Boolean);
`,
		`
const values = [1, 0, 2];
declare const callback: (value: number) => boolean;
const result = values.filter(callback);
`,
		`const transform = (value: number) => value * 2;`,
		`const transform = (value: string) => String(value) + "!";`,
		`
declare const other: string;
const transform = (value: string) => other;
`,
		`
declare const other: string;
const toString = (value: string) => String(other);
`,
		`const transform = (a: string, b: string) => String(a);`,
		`
declare const value: string;
const transform = () => String(value);
`,
		`
const values = [1, 0, 2];
const result = values.map((value) => value);
`,
		`
const values = [1, 0, 2];
const result = values.forEach((value) => value);
`,
		`
const values = [1, 0, 2];
const result = values.filter((a, b) => a);
`,
		`
const values = [1, 0, 2];
declare const value: boolean;
const result = values.filter(() => value);
`,
		`const transform = (value: string) => { const x = value; return String(x); };`,
		`const transform = (value: string) => { return; };`,
		`const transform = ({ value }: { value: string }) => String(value);`,
		`const transform = function ({ value }: { value: string }) { return String(value); };`,
	],
});
