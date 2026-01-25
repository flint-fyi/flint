import rule from "./anchorAmbiguousText.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<a href="/page">click here</a>
`,
			snapshot: `
<a href="/page">click here</a>
                ~~~~~~~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
		{
			code: `
<a href="/page">here</a>
`,
			snapshot: `
<a href="/page">here</a>
                ~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
		{
			code: `
<a href="/page">link</a>
`,
			snapshot: `
<a href="/page">link</a>
                ~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
		{
			code: `
<a href="/page">a link</a>
`,
			snapshot: `
<a href="/page">a link</a>
                ~~~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
		{
			code: `
<a href="/page">learn more</a>
`,
			snapshot: `
<a href="/page">learn more</a>
                ~~~~~~~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
		{
			code: `
<a href="/page">more</a>
`,
			snapshot: `
<a href="/page">more</a>
                ~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
		{
			code: `
<a href="/page">read more</a>
`,
			snapshot: `
<a href="/page">read more</a>
                ~~~~~~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
		{
			code: `
<a href="/page">Click Here</a>
`,
			snapshot: `
<a href="/page">Click Here</a>
                ~~~~~~~~~~
                This anchor element has ambiguous text that doesn't describe the link destination.
`,
		},
	],
	valid: [
		`<a href="/about">About Us</a>`,
		`<a href="/docs">View Documentation</a>`,
		`<a href="/contact">Contact Information</a>`,
		`<a href="/pricing">See Pricing Details</a>`,
		`<a href="/download">Download the App</a>`,
		`<CustomLink>click here</CustomLink>`,
	],
});
