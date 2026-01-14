import rule from "./headingIncrements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
# Heading 1

### Heading 3
`,
			snapshot: `
# Heading 1

### Heading 3
~~~
This heading level 3 skips more than one level from the previous heading level of 1.
`,
		},
	],
	valid: [
		`# Heading 1`,
		`
# Heading 1

## Heading 2
`,
	],
});
