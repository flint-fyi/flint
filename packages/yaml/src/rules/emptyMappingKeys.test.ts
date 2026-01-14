import rule from "./emptyMappingKeys.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
: a
`,
			snapshot: `
: a
~
This mapping has an empty key, which is often a mistake.
`,
		},
		{
			code: `
a:
    : b
`,
			snapshot: `
a:
    : b
    ~
    This mapping has an empty key, which is often a mistake.
`,
		},
		{
			code: `
a:
  : b
`,
			snapshot: `
a:
  : b
  ~
  This mapping has an empty key, which is often a mistake.
`,
		},
	],
	valid: [
		// https://github.com/prettier/yaml-unist-parser/issues/296
		// ``,

		`a: b`,
	],
});
