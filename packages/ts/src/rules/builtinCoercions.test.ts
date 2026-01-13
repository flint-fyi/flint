import rule from "./builtinCoercions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const toString = (value) => String(value);
`,
			output: `
const toString = String;
`,
			snapshot: `
const toString = (value) => String(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`String\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toNumber = (value) => Number(value);
`,
			output: `
const toNumber = Number;
`,
			snapshot: `
const toNumber = (value) => Number(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`Number\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toBigInt = (value) => BigInt(value);
`,
			output: `
const toBigInt = BigInt;
`,
			snapshot: `
const toBigInt = (value) => BigInt(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`BigInt\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toBoolean = (value) => Boolean(value);
`,
			output: `
const toBoolean = Boolean;
`,
			snapshot: `
const toBoolean = (value) => Boolean(value);
                  ~~~~~~~~~~~~~~~~~~~~~~~~~
                  Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toSymbol = (value) => Symbol(value);
`,
			output: `
const toSymbol = Symbol;
`,
			snapshot: `
const toSymbol = (value) => Symbol(value);
                 ~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`Symbol\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toString = (value) => { return String(value); };
`,
			output: `
const toString = String;
`,
			snapshot: `
const toString = (value) => { return String(value); };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`String\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const toString = function (value) { return String(value); };
`,
			output: `
const toString = String;
`,
			snapshot: `
const toString = function (value) { return String(value); };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer using \`String\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const truthy = values.filter((value) => value);
`,
			output: `
const truthy = values.filter(Boolean);
`,
			snapshot: `
const truthy = values.filter((value) => value);
                             ~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const truthy = values.filter(value => value);
`,
			output: `
const truthy = values.filter(Boolean);
`,
			snapshot: `
const truthy = values.filter(value => value);
                             ~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const hasTruthy = values.some((item) => item);
`,
			output: `
const hasTruthy = values.some(Boolean);
`,
			snapshot: `
const hasTruthy = values.some((item) => item);
                              ~~~~~~~~~~~~~~
                              Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const allTruthy = values.every((element) => element);
`,
			output: `
const allTruthy = values.every(Boolean);
`,
			snapshot: `
const allTruthy = values.every((element) => element);
                               ~~~~~~~~~~~~~~~~~~~~
                               Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const firstTruthy = values.find((item) => item);
`,
			output: `
const firstTruthy = values.find(Boolean);
`,
			snapshot: `
const firstTruthy = values.find((item) => item);
                                ~~~~~~~~~~~~~~
                                Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const lastTruthy = values.findLast((item) => item);
`,
			output: `
const lastTruthy = values.findLast(Boolean);
`,
			snapshot: `
const lastTruthy = values.findLast((item) => item);
                                   ~~~~~~~~~~~~~~
                                   Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const firstIndex = values.findIndex((item) => item);
`,
			output: `
const firstIndex = values.findIndex(Boolean);
`,
			snapshot: `
const firstIndex = values.findIndex((item) => item);
                                    ~~~~~~~~~~~~~~
                                    Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const lastIndex = values.findLastIndex((item) => item);
`,
			output: `
const lastIndex = values.findLastIndex(Boolean);
`,
			snapshot: `
const lastIndex = values.findLastIndex((item) => item);
                                       ~~~~~~~~~~~~~~
                                       Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const truthy = values.filter((value) => { return value; });
`,
			output: `
const truthy = values.filter(Boolean);
`,
			snapshot: `
const truthy = values.filter((value) => { return value; });
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const truthy = values.filter(function (value) { return value; });
`,
			output: `
const truthy = values.filter(Boolean);
`,
			snapshot: `
const truthy = values.filter(function (value) { return value; });
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
		{
			code: `
const truthy = values.filter((value) => (value));
`,
			output: `
const truthy = values.filter(Boolean);
`,
			snapshot: `
const truthy = values.filter((value) => (value));
                             ~~~~~~~~~~~~~~~~~~
                             Prefer using \`Boolean\` directly instead of wrapping it in a function.
`,
		},
	],
	valid: [
		`const result = String(value);`,
		`const result = Number(value);`,
		`const result = Boolean(value);`,
		`const result = values.filter(Boolean);`,
		`const result = values.filter(callback);`,
		`const transform = (value) => value * 2;`,
		`const transform = (value) => String(value) + "!";`,
		`const transform = (value) => other;`,
		`const toString = (value) => String(other);`,
		`const transform = (a, b) => String(a);`,
		`const transform = () => String(value);`,
		`const result = values.map((value) => value);`,
		`const result = values.forEach((value) => value);`,
		`const result = values.filter((a, b) => a);`,
		`const result = values.filter(() => value);`,
		`const transform = (value) => { const x = value; return String(x); };`,
		`const transform = (value) => { return; };`,
		`const transform = ({ value }) => String(value);`,
		`const transform = function ({ value }) { return String(value); };`,
	],
});
