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
		{ code: `<a>Link text</a>` },
		{ code: `<a><span>Link text</span></a>` },
		{ code: `<a aria-label="Link" />` },
		{ code: `<a aria-labelledby="label-id" />` },
		{ code: `<a title="Link title" />` },
		{ code: `<a>{variable}</a>` },
		{ code: `<CustomElement></CustomElement>` },
	],
});
