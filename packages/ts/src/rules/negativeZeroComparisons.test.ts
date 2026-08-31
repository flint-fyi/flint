import rule from "./negativeZeroComparisons.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: number;
if (value === -0) {}
`,
			snapshot: `
declare const value: number;
if (value === -0) {}
    ~~~~~~~~~~~~
    Comparisons with -0 using === do not distinguish between -0 and +0.
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare const value: number;
if (Object.is(value, -0)) {}
`,
				},
			],
		},
		{
			code: `
declare const value: number;
if (-0 === value) {}
`,
			snapshot: `
declare const value: number;
if (-0 === value) {}
    ~~~~~~~~~~~~
    Comparisons with -0 using === do not distinguish between -0 and +0.
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare const value: number;
if (Object.is(-0, value)) {}
`,
				},
			],
		},
		{
			code: `
declare const value: number;
if (value == -0) {}
`,
			snapshot: `
declare const value: number;
if (value == -0) {}
    ~~~~~~~~~~~
    Comparisons with -0 using == do not distinguish between -0 and +0.
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare const value: number;
if (Object.is(value, -0)) {}
`,
				},
			],
		},
		{
			code: `
declare const value: number;
if (value !== -0) {}
`,
			snapshot: `
declare const value: number;
if (value !== -0) {}
    ~~~~~~~~~~~~
    Comparisons with -0 using !== do not distinguish between -0 and +0.
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare const value: number;
if (!Object.is(value, -0)) {}
`,
				},
			],
		},
		{
			code: `
declare const value: number;
if (value != -0) {}
`,
			snapshot: `
declare const value: number;
if (value != -0) {}
    ~~~~~~~~~~~
    Comparisons with -0 using != do not distinguish between -0 and +0.
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare const value: number;
if (!Object.is(value, -0)) {}
`,
				},
			],
		},
		{
			code: `
declare const value: number;
if (value < -0) {}
`,
			snapshot: `
declare const value: number;
if (value < -0) {}
    ~~~~~~~~~~
    Comparisons with -0 using < do not distinguish between -0 and +0.
`,
		},
		{
			code: `
declare const value: number;
if (value <= -0) {}
`,
			snapshot: `
declare const value: number;
if (value <= -0) {}
    ~~~~~~~~~~~
    Comparisons with -0 using <= do not distinguish between -0 and +0.
`,
		},
		{
			code: `
declare const value: number;
if (value > -0) {}
`,
			snapshot: `
declare const value: number;
if (value > -0) {}
    ~~~~~~~~~~
    Comparisons with -0 using > do not distinguish between -0 and +0.
`,
		},
		{
			code: `
declare const value: number;
if (value >= -0) {}
`,
			snapshot: `
declare const value: number;
if (value >= -0) {}
    ~~~~~~~~~~~
    Comparisons with -0 using >= do not distinguish between -0 and +0.
`,
		},
		{
			code: `
declare const value: number;
const result = value === -0 ? "negative zero" : "other";
`,
			snapshot: `
declare const value: number;
const result = value === -0 ? "negative zero" : "other";
               ~~~~~~~~~~~~
               Comparisons with -0 using === do not distinguish between -0 and +0.
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare const value: number;
const result = Object.is(value, -0) ? "negative zero" : "other";
`,
				},
			],
		},
		{
			code: `
declare let value: number;
while (value !== -0) {
	value++;
}
`,
			snapshot: `
declare let value: number;
while (value !== -0) {
       ~~~~~~~~~~~~
       Comparisons with -0 using !== do not distinguish between -0 and +0.
	value++;
}
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare let value: number;
while (!Object.is(value, -0)) {
	value++;
}
`,
				},
			],
		},
		{
			code: `
declare const value: number;
const isNegativeZero = value === -0;
`,
			snapshot: `
declare const value: number;
const isNegativeZero = value === -0;
                       ~~~~~~~~~~~~
                       Comparisons with -0 using === do not distinguish between -0 and +0.
`,
			suggestions: [
				{
					id: "useObjectIs",
					updated: `
declare const value: number;
const isNegativeZero = Object.is(value, -0);
`,
				},
			],
		},
	],
	valid: [
		`
declare const value: number;
if (value === 0) {}
`,
		`
declare const value: number;
if (value === -1) {}
`,
		`
declare const value: number;
if (value === 1) {}
`,
		`
declare const value: number;
if (Object.is(value, -0)) {}
`,
		`
declare const value: number;
if (Object.is(-0, value)) {}
`,
		`const result = -0;`,
		`const value = -0 + 1;`,
		`const value = -0 * 2;`,
		`const value = Math.abs(-0);`,
		`const value = [-0, 0, 1];`,
		`function test() { return -0; }`,
	],
});
