import rule from "./equalityOperators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
a != undefined
`,
			snapshot: `
a != undefined
  ~~~~~~~~~~~~
  Compare with 'null' rather than 'undefined'
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
		},
		{
			code: `
a != null
`,
			options: { nullishComparisonStrictness: "strict" },
			snapshot: `
a != null
  ~~~~~~~
  Use strict equality ('!==') instead of '!='
`,
		},
		{
			code: `
null != a
`,
			options: { nullishComparisonStrictness: "strict" },
			snapshot: `
null != a
~~~~~~~
Use strict equality ('!==') instead of '!='
`,
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
		},
		{
			code: `
a != undefined
`,
			options: { nullishComparisonStrictness: "either" },
			snapshot: `
a != undefined
  ~~~~~~~~~~~~
  Compare with 'null' rather than 'undefined'
`,
		},
		{
			code: `
undefined != a
`,
			options: { nullishComparisonStrictness: "either" },
			snapshot: `
undefined != a
~~~~~~~~~~~~
Compare with 'null' rather than 'undefined'
`,
		},
		{
			code: `
a == b
`,
			snapshot: `
a == b
  ~~
	Use strict equality ('===') instead of loose equality ('==').
`,
		},
	],
	valid: [
		"a === b",
		"a !== b",
		"a == null",
		"null == a",
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
	],
});
