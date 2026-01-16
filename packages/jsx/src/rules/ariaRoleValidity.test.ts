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
		{ code: `<div role="button" />` },
		{ code: `<div role="navigation" />` },
		{ code: `<span role="link" />` },
		{ code: `<div role={dynamicRole} />` },
		{ code: `<div />` },
		{ code: `<button role="button" />` },
		{ code: `<CustomElement role="other" />` },
	],
});
