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
declare const Component: (props: Record<string, unknown>) => unknown;
<div>{<Component />}</div>
`,
			snapshot: `
declare const Component: (props: Record<string, unknown>) => unknown;
<div>{<Component />}</div>
     ~~~~~~~~~~~~~~~
     Curly braces are unnecessary around JSX elements.
`,
		},
		{
			code: `
declare const Component: (props: Record<string, unknown>) => unknown;
<Component>{<></>}</Component>
`,
			snapshot: `
declare const Component: (props: Record<string, unknown>) => unknown;
<Component>{<></>}</Component>
           ~~~~~~~
           Curly braces are unnecessary around JSX elements.
`,
		},
	],
	valid: [
		`<div>Hello</div>`,
		`<div><span>Content</span></div>`,
		`
declare const variable: unknown;
<div>{variable}</div>`,
		`
declare const someFunction: (...args: unknown[]) => unknown;
<div>{someFunction()}</div>`,
		`<div>{1 + 2}</div>`,
		`
declare const Component: (props: Record<string, unknown>) => unknown;
<Component attribute={"value"} />`,
	],
});
