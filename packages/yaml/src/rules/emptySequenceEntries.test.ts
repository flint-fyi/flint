import rule from "./emptySequenceEntries.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
-
`,
			snapshot: `
-
~
This sequence has an empty entry, which is often a mistake.
`,
		},
		{
			code: `
- one
-
- three
`,
			snapshot: `
- one
-
~
This sequence has an empty entry, which is often a mistake.
- three
`,
		},
		{
			code: `
items:
    -
    - value
`,
			snapshot: `
items:
    -
    ~
    This sequence has an empty entry, which is often a mistake.
    - value
`,
		},
	],
	valid: [`- one`, `- one\n- two`, `- null`, `items:\n  - value`],
});
