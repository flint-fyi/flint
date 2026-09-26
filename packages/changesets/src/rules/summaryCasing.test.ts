// Changeset frontmatter is only parsed at the very start of a file.
// flint-disable-file flint/invalidCodeLines
import { ruleTester } from "./ruleTester.ts";
import rule from "./summaryCasing.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `---
"example": patch
---

added a new option.
`,
			snapshot: `---
"example": patch
---

added a new option.
~
This changeset summary starts with a lowercase letter.
`,
			suggestions: [
				{
					id: "uppercaseFirstLetter",
					updated: `---
"example": patch
---

Added a new option.
`,
				},
			],
		},
		{
			code: `---
"example": patch
---

fix: added a new option.
`,
			snapshot: `---
"example": patch
---

fix: added a new option.
     ~
     This changeset summary starts with a lowercase letter.
`,
			suggestions: [
				{
					id: "uppercaseFirstLetter",
					updated: `---
"example": patch
---

fix: Added a new option.
`,
				},
			],
		},
		{
			code: `---
"example": patch
---

Added a new option.
`,
			options: { casing: "lowercase" },
			snapshot: `---
"example": patch
---

Added a new option.
~
This changeset summary starts with an uppercase letter.
`,
			suggestions: [
				{
					id: "lowercaseFirstLetter",
					updated: `---
"example": patch
---

added a new option.
`,
				},
			],
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

\`createPlugin\` now accepts a new option.
`,
		`---
"example": patch
---

createPlugin now accepts a new option.
`,
		`---
"example": patch
---

[Documentation](https://flint.fyi) was updated.
`,
		`---
"example": patch
---

3 new options were added.
`,
		{
			code: `---
"example": patch
---

added a new option.
`,
			options: { casing: "lowercase" },
		},
		{
			code: `---
"example": patch
---

JSON files are now supported.
`,
			options: { casing: "lowercase" },
		},
		{
			code: `---
"example": patch
---

TypeScript files are now supported.
`,
			options: { casing: "lowercase" },
		},
		`---
---
`,
		`# changesets
`,
	],
});
