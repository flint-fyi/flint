import rule from "./plainScalars.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
key: "simple"
`,
			snapshot: `
key: "simple"
     ~~~~~~~~
     Prefer plain scalars over quoted scalars.
`,
		},
		{
			code: `
key: 'simple'
`,
			snapshot: `
key: 'simple'
     ~~~~~~~~
     Prefer plain scalars over quoted scalars.
`,
		},
		{
			code: `
name: "hello"
`,
			snapshot: `
name: "hello"
      ~~~~~~~
      Prefer plain scalars over quoted scalars.
`,
		},
	],
	valid: [
		`key: simple`,
		`key: "contains: colon"`,
		`key: "has # comment"`,
		`key: "true"`,
		`key: "123"`,
		`key: ""`,
		`key: " starts with space"`,
		`key: "ends with space "`,
	],
});
