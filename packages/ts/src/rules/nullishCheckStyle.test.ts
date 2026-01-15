import rule from "./equalityNullishOperators.ts";
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
			options: { nullishComparisonStrictness: "strict" },
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
			options: { nullishComparisonStrictness: "strict" },
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
			options: { nullishComparisonStrictness: "either" },
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
			options: { nullishComparisonStrictness: "either" },
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
			options: { nullishComparisonStrictness: "strict" },
		},
		{
			code: `
undefined === foo
`,
			options: { nullishComparisonStrictness: "either" },
		},
		{
			code: `
a != undefined
`,
			options: { looseNullishComparisonStyle: "either" },
		},
		{
			code: `
a !== null
`,
			options: { nullishComparisonStrictness: "strict" },
		},
		{
			code: `
null !== a
`,
			options: { nullishComparisonStrictness: "strict" },
		},
		// Non-nullish comparisons should not be handled by this rule
		"a == b",
		"a === b",
		"a != b",
		"a !== b",
	],
});
