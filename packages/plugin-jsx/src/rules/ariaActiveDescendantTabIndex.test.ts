import rule from "./ariaActiveDescendantTabIndex.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div aria-activedescendant={someID} />
`,
			snapshot: `
<div aria-activedescendant={someID} />
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     This element with \`aria-activedescendant\` is missing a \`tabIndex\` attribute to manage focus state.
`,
		},
		{
			code: `
<span aria-activedescendant="item-1" />
`,
			snapshot: `
<span aria-activedescendant="item-1" />
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      This element with \`aria-activedescendant\` is missing a \`tabIndex\` attribute to manage focus state.
`,
		},
	],
	valid: [
		{ code: `<CustomComponent />` },
		{
			code: `<CustomComponent aria-activedescendant={someID} />`,
		},
		{
			code: `<CustomComponent aria-activedescendant={someID} tabIndex={0} />`,
		},
		{
			code: `
<div />`,
		},
		{ code: `<input />` },
		{
			code: `
<div tabIndex={0} />`,
		},
		{
			code: `
<div aria-activedescendant={someID} tabIndex={0} />
`,
		},
		{
			code: `
<div aria-activedescendant={someID} tabIndex="0" />
`,
		},
		{
			code: `
<div aria-activedescendant={someID} tabIndex={1} />
`,
		},
		{
			code: `
<div aria-activedescendant={someID} tabIndex={-1} />
`,
		},
		{ code: `<input aria-activedescendant={someID} />` },
		{ code: `<button aria-activedescendant={someID} />` },
	],
});
