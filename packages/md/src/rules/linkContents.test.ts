import rule from "./linkContents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[Flint]()
`,
			snapshot: `
[Flint]()
~~~~~~~~~
This link has an empty URL.
`,
		},
		{
			code: `
[Skip to Content](#)
`,
			snapshot: `
[Skip to Content](#)
~~~~~~~~~~~~~~~~~~~~
This link has an empty URL.
`,
		},
		{
			code: `
[Link text]()
`,
			snapshot: `
[Link text]()
~~~~~~~~~~~~~
This link has an empty URL.
`,
		},
		{
			code: `
Check out [this link]() for more info.
`,
			snapshot: `
Check out [this link]() for more info.
          ~~~~~~~~~~~~~
          This link has an empty URL.
`,
		},
		{
			code: `
[Valid link](https://example.com)

[Empty link]()
`,
			snapshot: `
[Valid link](https://example.com)

[Empty link]()
~~~~~~~~~~~~~~
This link has an empty URL.
`,
		},
	],
	valid: [
		`[Flint](https://flint.fyi)`,
		`[Skip to Content](#content)`,
		`[Link](./page.html)`,
		`[Relative](../docs/guide.md)`,
		`
[First](https://example.com/1)

[Second](https://example.com/2)
`,
		`
Check out [this link](https://example.com) for more info.
`,
	],
});
