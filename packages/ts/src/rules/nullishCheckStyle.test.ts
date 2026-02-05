import rule from "./nullishCheckStyle.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
a != undefined
`,
			output: `
a != null
`,
			snapshot: `
a != undefined
  ~~~~~~~~~~~~
  Compare with 'null' rather than 'undefined'.
`,
		},
		{
			code: `
a !== null
`,
			snapshot: `
a !== null
  ~~~~~~~~
  Use loose equality ('!=') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useLooseOperator",
					updated: `
a != null
`,
				},
			],
		},
		{
			code: `
a != null
`,
			options: { nullishComparisonStrictness: "triple-equals" },
			snapshot: `
a != null
  ~~~~~~~
  Use strict equality ('!==') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
a !== null
`,
				},
			],
		},
		{
			code: `
null != a
`,
			options: { nullishComparisonStrictness: "triple-equals" },
			snapshot: `
null != a
~~~~~~~
Use strict equality ('!==') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
null !== a
`,
				},
			],
		},
		{
			code: `
null !== a
`,
			snapshot: `
null !== a
~~~~~~~~
Use loose equality ('!=') for nullish comparisons.
`,
			suggestions: [
				{
					id: "useLooseOperator",
					updated: `
null != a
`,
				},
			],
		},
		{
			code: `
a != undefined
`,
			options: { nullishComparisonStrictness: "ignore" },
			output: `
a != null
`,
			snapshot: `
a != undefined
  ~~~~~~~~~~~~
  Compare with 'null' rather than 'undefined'.
`,
		},
		{
			code: `
undefined != a
`,
			options: { nullishComparisonStrictness: "ignore" },
			output: `
null != a
`,
			snapshot: `
undefined != a
~~~~~~~~~~~~
Compare with 'null' rather than 'undefined'.
`,
		},
	],
	valid: [
		"a == null",
		"null == a",
		"a != null",
		"null != a",
		{
			code: `
undefined === foo
`,
			options: { nullishComparisonStrictness: "triple-equals" },
		},
		{
			code: `
undefined === foo
`,
			options: { nullishComparisonStrictness: "ignore" },
		},
		{
			code: `
a != undefined
`,
			options: { looseNullishComparisonStyle: "ignore" },
		},
		{
			code: `
a !== null
`,
			options: { nullishComparisonStrictness: "triple-equals" },
		},
		{
			code: `
null !== a
`,
			options: { nullishComparisonStrictness: "triple-equals" },
		},
		// Non-nullish comparisons should not be handled by this rule
		"a == b",
		"a === b",
		"a != b",
		"a !== b",
	],
});
