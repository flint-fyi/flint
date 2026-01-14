import rule from "./imageAltTexts.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
![](sunset.png)
`,
			snapshot: `
![](sunset.png)
~~~~~~~~~~~~~~~
This image is missing alternative text.
`,
		},
		{
			code: `
![ ](sunset.png)
`,
			snapshot: `
![ ](sunset.png)
~~~~~~~~~~~~~~~~
This image has only whitespace as alternative text.
`,
		},
		{
			code: `
![   ](mountains.jpg)
`,
			snapshot: `
![   ](mountains.jpg)
~~~~~~~~~~~~~~~~~~~~~
This image has only whitespace as alternative text.
`,
		},
		{
			code: `
![][ref]

[ref]: sunset.png
`,
			snapshot: `
![][ref]
~~~~~~~~
This image is missing alternative text.

[ref]: sunset.png
`,
		},
		{
			code: `
![ ][logo]

[logo]: logo.png
`,
			snapshot: `
![ ][logo]
~~~~~~~~~~
This image has only whitespace as alternative text.

[logo]: logo.png
`,
		},
	],
	valid: [
		`![A beautiful sunset](sunset.png)`,
		`![Company logo][logo]

[logo]: logo.png`,
		`![Mountains](mountains.jpg)`,
		`
![Description here](image.png)

More content with ![another image](test.png).
`,
		`
Check out this ![amazing photo](photo.jpg) in the text.
`,
	],
});
