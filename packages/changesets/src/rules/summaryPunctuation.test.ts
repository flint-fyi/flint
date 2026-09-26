// Changeset frontmatter is only parsed at the very start of a file.
// flint-disable-file flint/invalidCodeLines
import { ruleTester } from "./ruleTester.ts";
import rule from "./summaryPunctuation.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `---
"example": patch
---

Added a new option
`,
			output: `---
"example": patch
---

Added a new option.
`,
			snapshot: `---
"example": patch
---

Added a new option
                 ~
                 This changeset summary does not end with punctuation as preferred for consistency.
`,
		},
		{
			code: `---
"example": patch
---

Added a new
\`option\`
`,
			output: `---
"example": patch
---

Added a new
\`option\`.
`,
			snapshot: `---
"example": patch
---

Added a new
\`option\`
       ~
       This changeset summary does not end with punctuation as preferred for consistency.
`,
		},
		{
			code: `---
"example": patch
---

Added the following options

- \`first\`
`,
			output: `---
"example": patch
---

Added the following options.

- \`first\`
`,
			snapshot: `---
"example": patch
---

Added the following options
                          ~
                          This changeset summary does not end with punctuation as preferred for consistency.

- \`first\`
`,
		},
		{
			code: `---
"example": patch
---

Added a new option.
`,
			options: { punctuation: "never" },
			output: `---
"example": patch
---

Added a new option
`,
			snapshot: `---
"example": patch
---

Added a new option.
                  ~
                  This changeset summary ends with punctuation, but for consistency should not.
`,
		},
		{
			code: `---
"example": patch
---

Added more options...
`,
			options: { punctuation: "never" },
			output: `---
"example": patch
---

Added more options
`,
			snapshot: `---
"example": patch
---

Added more options...
                  ~~~
                  This changeset summary ends with punctuation, but for consistency should not.
`,
		},
	],
	valid: [
		`---
"example": patch
---

Added a new option.
`,
		`---
"example": patch
---

Added a new option!
`,
		`---
"example": patch
---

Added a new
option.
`,
		`---
"example": patch
---

Added the following options:

- \`first\`
`,
		`---
"example": patch
---

Added a new option.

This paragraph has no ending punctuation
`,
		{
			code: `---
"example": patch
---

Added a new option
`,
			options: { punctuation: "never" },
		},
		`---
---
`,
		`# Changesets
`,
	],
});
