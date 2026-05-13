import rule from "./equalityOperators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
a == b
`,
			snapshot: `
a == b
  ~~
  Use the more precise strict equality ('===') instead of the loose '=='.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
a === b
`,
				},
			],
		},
		{
			code: `
x != y
`,
			snapshot: `
x != y
  ~~
  Use the more precise strict equality ('!==') instead of the loose '!='.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
x !== y
`,
				},
			],
		},
		{
			code: `
5 == value
`,
			snapshot: `
5 == value
  ~~
  Use the more precise strict equality ('===') instead of the loose '=='.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
5 === value
`,
				},
			],
		},
	],
	valid: [
		"a === b",
		"a !== b",
		"x === y",
		"x !== y",
		// Nullish comparisons are handled by nullishCheckStyle rule
		"a == null",
		"null == a",
		"a != null",
		"null != a",
		"a == undefined",
		"undefined == a",
		"a != undefined",
		"undefined != a",
		"a === null",
		"null === a",
		"a !== null",
		"null !== a",
		"a === undefined",
		"undefined === a",
		"a !== undefined",
		"undefined !== a",
	],
});
