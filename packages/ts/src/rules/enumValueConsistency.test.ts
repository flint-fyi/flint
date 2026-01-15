import rule from "./enumValueConsistency.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
enum Status { Active = 0, Inactive = "inactive" }
`,
			snapshot: `
enum Status { Active = 0, Inactive = "inactive" }
     ~~~~~~
     Enum 'Status' contains both number and string members, which can cause unexpected iteration behavior.
`,
		},
		{
			code: `
enum Mixed { First, Second = "second" }
`,
			snapshot: `
enum Mixed { First, Second = "second" }
     ~~~~~
     Enum 'Mixed' contains both number and string members, which can cause unexpected iteration behavior.
`,
		},
		{
			code: `
enum Values { a = 1, b = 2, c = "three" }
`,
			snapshot: `
enum Values { a = 1, b = 2, c = "three" }
     ~~~~~~
     Enum 'Values' contains both number and string members, which can cause unexpected iteration behavior.
`,
		},
	],
	valid: [
		`enum NumericOnly { a, b, c }`,
		`enum NumericExplicit { a = 0, b = 1, c = 2 }`,
		`enum StringOnly { a = "a", b = "b", c = "c" }`,
		`enum SingleMember { only = 1 }`,
		`enum Empty {}`,
	],
});
