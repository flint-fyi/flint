import rule from "./nullishCheckStyle.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != undefined
`,
			output: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != null
`,
			snapshot: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != undefined
  ~~~~~~~~~~~~
  Compare with 'null' rather than 'undefined'.
`,
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a !== null
`,
			snapshot: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a !== null
  ~~~~~~~~
  Use loose equality ('!=') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useLooseOperator",
					updated: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != null
`,
				},
			],
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != null
`,
			options: { nullishComparisonStrictness: "triple-equals" },
			snapshot: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != null
  ~~~~~~~
  Use strict equality ('!==') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a !== null
`,
				},
			],
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null != a
`,
			options: { nullishComparisonStrictness: "triple-equals" },
			snapshot: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null != a
~~~~~~~
Use strict equality ('!==') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null !== a
`,
				},
			],
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null !== a
`,
			snapshot: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null !== a
~~~~~~~~
Use loose equality ('!=') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useLooseOperator",
					updated: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null != a
`,
				},
			],
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != undefined
`,
			options: { nullishComparisonStrictness: "ignore" },
			output: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != null
`,
			snapshot: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != undefined
  ~~~~~~~~~~~~
  Compare with 'null' rather than 'undefined'.
`,
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
undefined != a
`,
			options: { nullishComparisonStrictness: "ignore" },
			output: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null != a
`,
			snapshot: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
undefined != a
~~~~~~~~~~~~
Compare with 'null' rather than 'undefined'.
`,
		},
	],
	valid: [
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\na == null`,
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\nnull == a`,
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\na != null`,
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\nnull != a`,
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
undefined === foo
`,
			options: { nullishComparisonStrictness: "triple-equals" },
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
undefined === foo
`,
			options: { nullishComparisonStrictness: "ignore" },
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a != undefined
`,
			options: { looseNullishComparisonStyle: "ignore" },
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
a !== null
`,
			options: { nullishComparisonStrictness: "triple-equals" },
		},
		{
			code: `
declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;
null !== a
`,
			options: { nullishComparisonStrictness: "triple-equals" },
		},
		// Non-nullish comparisons should not be handled by this rule
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\na == b`,
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\na === b`,
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\na != b`,
		`declare const a: unknown;
declare const b: unknown;
declare const foo: unknown;\na !== b`,
	],
});
