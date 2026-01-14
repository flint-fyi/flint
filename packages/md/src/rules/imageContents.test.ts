import rule from "./imageContents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
![]()
`,
			snapshot: `
![]()
~~~~~
This image has an empty URL.
`,
		},
		{
			code: `
![Flint Logo]()
`,
			snapshot: `
![Flint Logo]()
~~~~~~~~~~~~~~~
This image has an empty URL.
`,
		},
		{
			code: `
![](#)
`,
			snapshot: `
![](#)
~~~~~~
This image has an empty URL.
`,
		},
		{
			code: `
![Image](#)
`,
			snapshot: `
![Image](#)
~~~~~~~~~~~
This image has an empty URL.
`,
		},
		{
			code: `
![Valid image](image.png)

![Empty image]()
`,
			snapshot: `
![Valid image](image.png)

![Empty image]()
~~~~~~~~~~~~~~~~
This image has an empty URL.
`,
		},
	],
	valid: [
		`![](https://flint.fyi/image.png)`,
		`![Flint Logo](https://flint.fyi/logo.png)`,
		`![Mountains](mountains.jpg)`,
		`![Logo](./logo.png)`,
		`
![Valid](image1.png)

![Also valid](image2.png)
`,
		`
Check out this ![inline image](photo.jpg) in the text.
`,
	],
});
