import rule from "./isNaNComparisons.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
value === NaN;
export {};
`,
			snapshot: `
value === NaN;
~~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
value == NaN;
export {};
`,
			snapshot: `
value == NaN;
~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
value !== NaN;
export {};
`,
			snapshot: `
value !== NaN;
~~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
value != NaN;
export {};
`,
			snapshot: `
value != NaN;
~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
NaN === value;
export {};
`,
			snapshot: `
NaN === value;
~~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
value > NaN;
export {};
`,
			snapshot: `
value > NaN;
~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
value < NaN;
export {};
`,
			snapshot: `
value < NaN;
~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
value >= NaN;
export {};
`,
			snapshot: `
value >= NaN;
~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
value <= NaN;
export {};
`,
			snapshot: `
value <= NaN;
~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
if (value === NaN) {}
export {};
`,
			snapshot: `
if (value === NaN) {}
    ~~~~~~~~~~~~~
    Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
		{
			code: `
(value) === (NaN);
export {};
`,
			snapshot: `
(value) === (NaN);
~~~~~~~~~~~~~~~~~
Use \`Number.isNaN()\` instead of comparing with \`NaN\`.
export {};
`,
		},
	],
	valid: [
		`Number.isNaN(value); export {};`,
		`isNaN(value); export {};`,
		`value === 0; export {};`,
		`value === Infinity; export {};`,
		`value === undefined; export {};`,
		`value === null; export {};`,
		`value + NaN; export {};`,
		`value - NaN; export {};`,
		`
const NaN = 1;
value === NaN;
export {};
`,
		`
function NaN() {}
value === NaN;
export {};
`,
	],
});
