import rule from "./keyDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
  "a": "first",
  "a": "second",
}
`,
			snapshot: `
{
  "a": "first",
  ~~~
  This key is made redundant by an identical key later in the object.
  "a": "second",
}
`,
		},
		{
			code: `
{
  "a": "first",
  "a": "second",
}
`,
			options: {
				allowKeys: ["//"],
			},
			snapshot: `
{
  "a": "first",
  ~~~
  This key is made redundant by an identical key later in the object.
  "a": "second",
}
`,
		},
	],
	valid: [
		`{}`,
		`{ "a": "apple" }`,
		`
{
  "a": "first",
  "b": "second",
}
`,
		{
			code: `
{
  "//": "first",
  "//": "second",
}`,
			options: {
				allowKeys: ["//"],
			},
		},
	],
});
