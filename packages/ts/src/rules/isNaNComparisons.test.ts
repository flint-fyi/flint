import rule from "./isNaNComparisons.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: number;
value > NaN;
export {};
`,
			snapshot: `
declare const value: number;
value > NaN;
~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
declare const value: number;
value < NaN;
export {};
`,
			snapshot: `
declare const value: number;
value < NaN;
~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
declare const value: number;
value >= NaN;
export {};
`,
			snapshot: `
declare const value: number;
value >= NaN;
~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
declare const value: number;
value <= NaN;
export {};
`,
			snapshot: `
declare const value: number;
value <= NaN;
~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
	],
	valid: [
		`declare const value: number; Number.isNaN(value); export {};`,
		`declare const value: number; isNaN(value); export {};`,
		`declare const value: number; value === 0; export {};`,
		`declare const value: number; value === Infinity; export {};`,
		`declare const value: number | undefined; value === undefined; export {};`,
		`declare const value: number | null; value === null; export {};`,
		`declare const value: number; value + NaN; export {};`,
		`declare const value: number; value - NaN; export {};`,
		`
declare const value: number;
const NaN = 1;
value === NaN;
export {};
`,
		`
declare const value: unknown;
function NaN() {}
value === NaN;
export {};
`,
	],
});
