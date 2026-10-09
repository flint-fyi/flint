// Changeset frontmatter is only parsed at the very start of a file.
// flint-disable-file flint/invalidCodeLines
import { ruleTester } from "./ruleTester.ts";
import rule from "./summaryReadability.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `---
"example": patch
---

feat: Added a new option.
`,
			output: `---
"example": patch
---

Added a new option.
`,
			snapshot: `---
"example": patch
---

feat: Added a new option.
~~~~~~
This changeset summary unnecessarily starts with a conventional commit prefix.
`,
		},
		{
			code: `---
"example": patch
---

fix(core)!: Fixed a crash (in rare cases): a detail.
`,
			output: `---
"example": patch
---

Fixed a crash (in rare cases): a detail.
`,
			snapshot: `---
"example": patch
---

fix(core)!: Fixed a crash (in rare cases): a detail.
~~~~~~~~~~~~
This changeset summary unnecessarily starts with a conventional commit prefix.
`,
		},
		{
			code: `---
"example": patch
---

CHORE: Updated dependencies.
`,
			output: `---
"example": patch
---

Updated dependencies.
`,
			snapshot: `---
"example": patch
---

CHORE: Updated dependencies.
~~~~~~~
This changeset summary unnecessarily starts with a conventional commit prefix.
`,
		},
		{
			code: `---
"example": patch
---

feature: Added a new option.
`,
			output: `---
"example": patch
---

Added a new option.
`,
			snapshot: `---
"example": patch
---

feature: Added a new option.
~~~~~~~~~
This changeset summary unnecessarily starts with a conventional commit prefix.
`,
		},
		{
			code: `---
"example": patch
---

deps: Updated dependencies.
`,
			options: { types: ["deps"] },
			output: `---
"example": patch
---

Updated dependencies.
`,
			snapshot: `---
"example": patch
---

deps: Updated dependencies.
~~~~~~
This changeset summary unnecessarily starts with a conventional commit prefix.
`,
		},
		{
			code: `---
"example": patch
---
`,
			snapshot: `---
~~~
This changeset has no summary to inform changelog generation.
"example": patch
~~~~~~~~~~~~~~~~
---
~~~
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

Fixed \`feat: \` prefixes being parsed.
`,
		`---
"example": patch
---

## Breaking Changes

feat: Removed the old option.
`,
		`---
"example": patch
---

Note: Added a new option.
`,
		`---
"example": patch
---

deps: Updated dependencies.
`,
		{
			code: `---
"example": patch
---

feat: Added a new option.
`,
			options: { types: ["deps"] },
		},
		`---
---
`,
		`# Changesets

Hello and welcome!
`,
	],
});
