import rule from "./blockSequences.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
items: [a, b, c]
`,
			output: `
items:
  - a
  - b
  - c
`,
			snapshot: `
items: [a, b, c]
       ~~~~~~~~~
       Prefer block style sequences over flow style sequences.
`,
		},
		{
			code: `
value: [1, 2, 3]
`,
			output: `
value:
  - 1
  - 2
  - 3
`,
			snapshot: `
value: [1, 2, 3]
       ~~~~~~~~~
       Prefer block style sequences over flow style sequences.
`,
		},
		{
			code: `
nested:
  items: [x, y]
`,
			output: `
nested:
  items:
    - x
    - y
`,
			snapshot: `
nested:
  items: [x, y]
         ~~~~~~
         Prefer block style sequences over flow style sequences.
`,
		},
		{
			code: `
empty: []
`,
			output: `
empty:
`,
			snapshot: `
empty: []
       ~~
       Prefer block style sequences over flow style sequences.
`,
		},
		{
			code: `
quoted: ["a", "b", "c"]
`,
			output: `
quoted:
  - "a"
  - "b"
  - "c"
`,
			snapshot: `
quoted: ["a", "b", "c"]
        ~~~~~~~~~~~~~~~
        Prefer block style sequences over flow style sequences.
`,
		},
		{
			code: `
single: [item]
`,
			output: `
single:
  - item
`,
			snapshot: `
single: [item]
        ~~~~~~
        Prefer block style sequences over flow style sequences.
`,
		},
	],
	valid: [
		`items:
  - a
  - b
  - c`,
		`value:
  - 1
  - 2
  - 3`,
		`nested:
  items:
    - x
    - y`,
		`single:
  - item`,
	],
});
