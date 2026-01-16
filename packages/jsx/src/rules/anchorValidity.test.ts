import rule from "./anchorValidity.ts";
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
Anchor element is missing an href attribute.
`,
		},
		{
			code: `
<a href="#" />
`,
			snapshot: `
<a href="#" />
~~~~~~~~~~~~~~
Anchor has an invalid href value '#'.
`,
		},
		{
			code: `
<a href="javascript:void(0)" />
`,
			snapshot: `
<a href="javascript:void(0)" />
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Anchor has an invalid href value 'javascript:void(0)'.
`,
		},
		{
			code: `
<a onClick={() => {}} />
`,
			snapshot: `
<a onClick={() => {}} />
~~~~~~~~~~~~~~~~~~~~~~~~
Anchor with onClick handler should be a button.
`,
		},
		{
			code: `
<a href="#" onClick={() => {}} />
`,
			snapshot: `
<a href="#" onClick={() => {}} />
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Anchor with onClick handler should be a button.
`,
		},
	],
	valid: [
		{ code: `<a href="https://example.com" />` },
		{ code: `<a href="/path" />` },
		{ code: `<a href="#section" />` },
		{ code: `<a href="page.html" />` },
		{
			code: `<a href="https://example.com" onClick={() => {}} />`,
		},
		{ code: `<a href={someVariable} />` },
		{ code: `<CustomElement href={false} />` },
	],
});
