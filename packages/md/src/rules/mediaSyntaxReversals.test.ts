import rule from "./mediaSyntaxReversals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
(Flint)[https://flint.fyi]
`,
			snapshot: `
(Flint)[https://flint.fyi]
~~~~~~~~~~~~~~~~~~~~~~~~~~
This link syntax is reversed and will not render as an image.
`,
		},
		{
			code: `
!(A beautiful sunset)[sunset.png]
`,
			snapshot: `
!(A beautiful sunset)[sunset.png]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This image syntax is reversed and will not render as an image.
`,
		},
		{
			code: `
# (Flint)[https://flint.fyi]
`,
			snapshot: `
# (Flint)[https://flint.fyi]
  ~~~~~~~~~~~~~~~~~~~~~~~~~~
  This link syntax is reversed and will not render as an image.
`,
		},
		{
			code: `
# !(A beautiful sunset)[sunset.png]
`,
			snapshot: `
# !(A beautiful sunset)[sunset.png]
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  This image syntax is reversed and will not render as an image.
`,
		},
		{
			code: `
Check out (this link)[https://example.com] for more info.
`,
			snapshot: `
Check out (this link)[https://example.com] for more info.
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          This link syntax is reversed and will not render as an image.
`,
		},
		{
			code: `
Both (link)[url] and !(image)[path] are wrong.
`,
			snapshot: `
Both (link)[url] and !(image)[path] are wrong.
                     ~~~~~~~~~~~~~~
                     This image syntax is reversed and will not render as an image.
     ~~~~~~~~~~~
     This link syntax is reversed and will not render as an image.
`,
		},
	],
	valid: [
		`
[Flint](https://flint.fyi)
`,
		`
![A beautiful sunset](sunset.png)
`,
		`
# [Flint](https://flint.fyi)
`,
		`
# ![A beautiful sunset](sunset.png)
`,
		`
Check out [this link](https://example.com) for more info.
`,
		`
Both [link](url) and ![image](path) are correct.
`,
		`
Normal (parentheses) and [square brackets] are fine.
`,
	],
});
