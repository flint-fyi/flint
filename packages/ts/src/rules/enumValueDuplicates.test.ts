import rule from "./enumValueDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
enum Status { Active = 1, Inactive = 1 }
`,
			snapshot: `
enum Status { Active = 1, Inactive = 1 }
                          ~~~~~~~~~~~~
                          Enum member 'Inactive' has a duplicate value '1' which is already used by 'Active'.
`,
		},
		{
			code: `
enum Color { Red = "r", Blue = "r" }
`,
			snapshot: `
enum Color { Red = "r", Blue = "r" }
                        ~~~~~~~~~~
                        Enum member 'Blue' has a duplicate value 'r' which is already used by 'Red'.
`,
		},
		{
			code: `
enum Values { a = 1, b = 2, c = 1 }
`,
			snapshot: `
enum Values { a = 1, b = 2, c = 1 }
                            ~~~~~
                            Enum member 'c' has a duplicate value '1' which is already used by 'a'.
`,
		},
		{
			code: `
enum Numbers { pos = 1, neg = -1, zero = 0, alsoZero = -0 }
`,
			snapshot: `
enum Numbers { pos = 1, neg = -1, zero = 0, alsoZero = -0 }
                                            ~~~~~~~~~~~~~
                                            Enum member 'alsoZero' has a duplicate value '0' which is already used by 'zero'.
`,
		},
	],
	valid: [
		`enum Status { Active = 1, Inactive = 2 }`,
		`enum Color { Red = "red", Blue = "blue" }`,
		`enum Implicit { a, b, c }`,
		`enum Computed { a = getValue(), b = getValue() }`,
		`enum Mixed { a = 1, b = "b" }`,
		`enum Empty {}`,
	],
});
