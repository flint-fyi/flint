import rule from "./accessKeys.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<button accessKey="h">Help</button>
`,
			snapshot: `
<button accessKey="h">Help</button>
        ~~~~~~~~~
        The native DOM \`accessKey\` prop causes accessibility issues with keyboard-only users and screen readers.
`,
		},
		{
			code: `
<div accesskey="x">Something</div>
`,
			snapshot: `
<div accesskey="x">Something</div>
     ~~~~~~~~~
     The native DOM \`accesskey\` prop causes accessibility issues with keyboard-only users and screen readers.
`,
		},
	],
	valid: [
		{ code: `<button>Click me</button>` },
		{
			code: `<div className="accessKey">not an attribute</div>`,
		},
		{ code: `const a = <span />;` },
	],
});
