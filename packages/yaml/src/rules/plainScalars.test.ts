import rule from "./plainScalars.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `key: "simple"`,
			snapshot: `key: "simple"
     ~~~~~~~~
     Prefer plain scalar over quoted scalar.`,
		},
		{
			code: `key: 'simple'`,
			snapshot: `key: 'simple'
     ~~~~~~~~
     Prefer plain scalar over quoted scalar.`,
		},
		{
			code: `name: "hello"`,
			snapshot: `name: "hello"
      ~~~~~~~
      Prefer plain scalar over quoted scalar.`,
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
