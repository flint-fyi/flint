import rule from "./emptyMappingValues.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
a:
`,
			snapshot: `
a:
 ~
 This mapping has an empty value, which is often a mistake.
`,
		},
		{
			code: `
parent:
    child:
`,
			snapshot: `
parent:
    child:
         ~
         This mapping has an empty value, which is often a mistake.
`,
		},
		{
			code: `
first: value
second:
`,
			snapshot: `
first: value
second:
      ~
      This mapping has an empty value, which is often a mistake.
`,
		},
		{
			code: `
{key:}
`,
			snapshot: `
{key:}
    ~
    This mapping has an empty value, which is often a mistake.
`,
		},
	],
	valid: [
		`a: b`,
		`key: null`,
		`key: ""`,
		`key: value`,
		`nested:\n  child: value`,
	],
});
