import rule from "./ariaRoleValidity.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div role="datepicker" />
`,
			snapshot: `
<div role="datepicker" />
     ~~~~~~~~~~~~~~~~~
     Invalid ARIA role 'datepicker'. Use a valid, non-abstract role.
`,
		},
		{
			code: `
<div role="range" />
`,
			snapshot: `
<div role="range" />
     ~~~~~~~~~~~~
     Invalid ARIA role 'range'. Use a valid, non-abstract role.
`,
		},
		{
			code: `
<div role="" />
`,
			snapshot: `
<div role="" />
     ~~~~~~~
     Invalid ARIA role '(empty)'. Use a valid, non-abstract role.
`,
		},
		{
			code: `
<span role="invalid" />
`,
			snapshot: `
<span role="invalid" />
      ~~~~~~~~~~~~~~
      Invalid ARIA role 'invalid'. Use a valid, non-abstract role.
`,
		},
	],
	valid: [
		`<div role="button" />`,
		`<div role="navigation" />`,
		`<span role="link" />`,
		`<div role={dynamicRole} />`,
		`<div />`,
		`<button role="button" />`,
		`<CustomElement role="other" />`,
	],
});
