import rule from "./arrayMapIdentities.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const values: number[][];
const result = values.flatMap((value) => value);
`,
			output: `
declare const values: number[][];
const result = values.flat();
`,
			snapshot: `
declare const values: number[][];
const result = values.flatMap((value) => value);
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
declare const values: number[][];
const result = values.flatMap(value => value);
`,
			output: `
declare const values: number[][];
const result = values.flat();
`,
			snapshot: `
declare const values: number[][];
const result = values.flatMap(value => value);
                     ~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
declare const values: number[][];
const result = values.flatMap((item) => { return item; });
`,
			output: `
declare const values: number[][];
const result = values.flat();
`,
			snapshot: `
declare const values: number[][];
const result = values.flatMap((item) => { return item; });
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
declare const values: number[][];
const result = values.flatMap(function (element) { return element; });
`,
			output: `
declare const values: number[][];
const result = values.flat();
`,
			snapshot: `
declare const values: number[][];
const result = values.flatMap(function (element) { return element; });
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
declare const values: number[][];
const result = values.flatMap((value) => (value));
`,
			output: `
declare const values: number[][];
const result = values.flat();
`,
			snapshot: `
declare const values: number[][];
const result = values.flatMap((value) => (value));
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
declare const values: number[][];
const result = values.flatMap((value) => { return (value); });
`,
			output: `
declare const values: number[][];
const result = values.flat();
`,
			snapshot: `
declare const values: number[][];
const result = values.flatMap((value) => { return (value); });
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
		{
			code: `
declare function getValues(): number[][];
const result = getValues().flatMap((item) => item);
`,
			output: `
declare function getValues(): number[][];
const result = getValues().flat();
`,
			snapshot: `
declare function getValues(): number[][];
const result = getValues().flatMap((item) => item);
                          ~~~~~~~~~~~~~~~~~~~~~~~~
                          Prefer \`.flat()\` over \`.flatMap()\` when the callback returns its argument unchanged.
`,
		},
	],
	valid: [
		`
declare const values: number[];
const result = values.flatMap((value) => value * 2);
`,
		`
declare const values: number[];
declare const transform: (value: number) => number;
const result = values.flatMap((value) => transform(value));
`,
		`
declare const values: number[];
const result = values.flatMap((value) => [value, value]);
`,
		`
declare const values: number[];
declare const other: number[];
const result = values.flatMap((value) => other);
`,
		`
declare const values: number[];
const result = values.flatMap((value) => {
    return value * 2;
});
`,
		`
declare const values: number[];
declare const other: number[];
const result = values.flatMap((value) => {
    return other;
});
`,
		`
declare const values: number[][];
const result = values.flat();
`,
		`
declare const values: number[];
const result = values.map((value) => value);
`,
		`
declare const values: number[];
const result = values.flatMap((a, b) => a);
`,
		`
declare const values: number[];
declare const value: number;
const result = values.flatMap(() => value);
`,
		`
declare const values: number[];
declare const callback: (value: number) => number;
const result = values.flatMap(callback);
`,
		`
declare const values: number[];
const result = values.flatMap((value) => {
    const x = value;
    return x;
});
`,
		`
declare const values: number[];
const result = values.flatMap((value) => {
    return;
});
`,
		`
declare const values: number[];
declare const thisArg: unknown;
const result = values.flatMap((value) => value, thisArg);
`,
		`
declare const values: { value: number }[];
const result = values.flatMap(({ value }) => value);
`,
		`
declare const values: { value: number }[];
const result = values.flatMap(function ({ value }) {
    return value;
});
`,
		`
declare function flatMap(callback: (value: number) => number): number[];
flatMap((value) => value);
`,
	],
});
