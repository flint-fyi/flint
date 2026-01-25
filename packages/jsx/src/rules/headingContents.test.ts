import rule from "./headingContents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<h1 />
`,
			snapshot: `
<h1 />
 ~~
 This heading element is missing accessible content.
`,
		},
		{
			code: `
<h2></h2>
`,
			snapshot: `
<h2></h2>
 ~~
 This heading element is missing accessible content.
`,
		},
		{
			code: `
<h3>  </h3>
`,
			snapshot: `
<h3>  </h3>
 ~~
 This heading element is missing accessible content.
`,
		},
	],
	valid: [
		`<h1>Heading Content</h1>`,
		`<h2><TextWrapper /></h2>`,
		`<h4 aria-label="Heading" />`,
		`<h5 aria-labelledby="heading-id" />`,
		`<div>Not a heading</div>`,
		`<h6>{content}</h6>`,
	],
});
