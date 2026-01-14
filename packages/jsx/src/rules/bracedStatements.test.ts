import rule from "./bracedStatements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div>{"Hello"}</div>
`,
			snapshot: `
<div>{"Hello"}</div>
     ~~~~~~~~~
     Curly braces are unnecessary around string literals.
`,
		},
		{
			code: `
<div>{<span>Content</span>}</div>
`,
			snapshot: `
<div>{<span>Content</span>}</div>
     ~~~~~~~~~~~~~~~~~~~~~~
     Curly braces are unnecessary around JSX elements.
`,
		},
		{
			code: `
<div>{<Component />}</div>
`,
			snapshot: `
<div>{<Component />}</div>
     ~~~~~~~~~~~~~~~
     Curly braces are unnecessary around JSX elements.
`,
		},
		{
			code: `
<Component>{<></>}</Component>
`,
			snapshot: `
<Component>{<></>}</Component>
           ~~~~~~~
           Curly braces are unnecessary around JSX elements.
`,
		},
	],
	valid: [
		{ code: `<div>Hello</div>` },
		{ code: `<div><span>Content</span></div>` },
		{ code: `<div>{variable}</div>` },
		{ code: `<div>{someFunction()}</div>` },
		{ code: `<div>{1 + 2}</div>` },
		{ code: `<Component attribute={"value"} />` },
	],
});
