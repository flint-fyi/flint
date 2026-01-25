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
		`<div>Hello</div>`,
		`<div><span>Content</span></div>`,
		`<div>{variable}</div>`,
		`<div>{someFunction()}</div>`,
		`<div>{1 + 2}</div>`,
		`<Component attribute={"value"} />`,
	],
});
