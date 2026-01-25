import rule from "./anchorContent.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<a />
`,
			snapshot: `
<a />
~~~~~
This anchor element is missing accessible content.
`,
		},
		{
			code: `
<a></a>
`,
			snapshot: `
<a></a>
~~~
This anchor element is missing accessible content.
`,
		},
		{
			code: `
<a><span aria-hidden /></a>
`,
			snapshot: `
<a><span aria-hidden /></a>
~~~
This anchor element is missing accessible content.
`,
		},
	],
	valid: [
		`<a>Link text</a>`,
		`<a><span>Link text</span></a>`,
		`<a aria-label="Link" />`,
		`<a aria-labelledby="label-id" />`,
		`<a title="Link title" />`,
		`<a>{variable}</a>`,
		`<CustomElement></CustomElement>`,
	],
});
