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
		`<CustomComponent />`,
		`<CustomComponent aria-activedescendant={someID} />`,
		`<CustomComponent aria-activedescendant={someID} tabIndex={0} />`,
		`<div />`,
		`<input />`,
		`<div tabIndex={0} />`,
		`<div aria-activedescendant={someID} tabIndex={0} />`,
		`<div aria-activedescendant={someID} tabIndex="0" />`,
		`<div aria-activedescendant={someID} tabIndex={1} />`,
		`<div aria-activedescendant={someID} tabIndex={-1} />`,
		`<input aria-activedescendant={someID} />`,
		`<button aria-activedescendant={someID} />`,
	],
});
