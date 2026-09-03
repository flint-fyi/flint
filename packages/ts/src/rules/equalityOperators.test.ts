import rule from "./equalityOperators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const a: unknown;
declare const b: unknown;
a == b
`,
			snapshot: `
declare const a: unknown;
declare const b: unknown;
a == b
  ~~
  Use the more precise strict equality ('===') instead of the loose '=='.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
declare const a: unknown;
declare const b: unknown;
a === b
`,
				},
			],
		},
		{
			code: `
declare const x: unknown;
declare const y: unknown;
x != y
`,
			snapshot: `
declare const x: unknown;
declare const y: unknown;
x != y
  ~~
  Use the more precise strict equality ('!==') instead of the loose '!='.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
declare const x: unknown;
declare const y: unknown;
x !== y
`,
				},
			],
		},
		{
			code: `
declare const value: number;
5 == value
`,
			snapshot: `
declare const value: number;
5 == value
  ~~
  Use the more precise strict equality ('===') instead of the loose '=='.
`,
			suggestions: [
				{
					id: "useStrictOperator",
					updated: `
declare const value: number;
5 === value
`,
				},
			],
		},
	],
	valid: [
		`
declare const a: unknown;
declare const b: unknown;
a === b
`,
		`
declare const a: unknown;
declare const b: unknown;
a !== b
`,
		`
declare const x: unknown;
declare const y: unknown;
x === y
`,
		`
declare const x: unknown;
declare const y: unknown;
x !== y
`,
		// Nullish comparisons are handled by nullishCheckStyle rule
		`
declare const a: unknown;
a == null
`,
		`
declare const a: unknown;
null == a
`,
		`
declare const a: unknown;
a != null
`,
		`
declare const a: unknown;
null != a
`,
		`
declare const a: unknown;
a == undefined
`,
		`
declare const a: unknown;
undefined == a
`,
		`
declare const a: unknown;
a != undefined
`,
		`
declare const a: unknown;
undefined != a
`,
		`
declare const a: unknown;
a === null
`,
		`
declare const a: unknown;
null === a
`,
		`
declare const a: unknown;
a !== null
`,
		`
declare const a: unknown;
null !== a
`,
		`
declare const a: unknown;
a === undefined
`,
		`
declare const a: unknown;
undefined === a
`,
		`
declare const a: unknown;
a !== undefined
`,
		`
declare const a: unknown;
undefined !== a
`,
	],
});
