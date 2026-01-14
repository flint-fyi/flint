import rule from "./commentTextNodes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div>// This looks like a comment</div>`,
			snapshot: `
<div>// This looks like a comment</div>
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     This text looks like a comment but will be rendered as text in the JSX output.`,
		},
		{
			code: `
<div>/* This also looks like a comment */</div>`,
			snapshot: `
<div>/* This also looks like a comment */</div>
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     This text looks like a comment but will be rendered as text in the JSX output.`,
		},
		{
			code: `
<span>
    // comment text
</span>`,
			snapshot: `
<span>
    // comment text
    ~~~~~~~~~~~~~~~
    This text looks like a comment but will be rendered as text in the JSX output.
</span>
`,
		},
		{
			code: `
<p>
    /* inline comment */
</p>`,
			snapshot: `
<p>
    /* inline comment */
    ~~~~~~~~~~~~~~~~~~~~
    This text looks like a comment but will be rendered as text in the JSX output.
</p>
`,
		},
	],
	valid: [
		{ code: `<div>Regular text</div>` },
		{ code: `<div>{/* This is a real comment */}</div>` },
		{
			code: `<div>
    {/* Comment inside expression */}
    Text content
</div>`,
		},
		{ code: `<span>No comment syntax here</span>` },
		{
			code: `<div>
    {// Single line comment in expression
    }
</div>`,
		},
		{
			code: `<a href="https://example.com">Link</a>`,
		},
		{
			code: `<div>Text before // comment syntax</div>`,
		},
		{
			code: `<div>Text before /* comment */ syntax</div>`,
		},
	],
});
