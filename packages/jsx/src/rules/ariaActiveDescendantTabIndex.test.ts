import rule from "./ariaActiveDescendantTabIndex.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const someID: string;
<div aria-activedescendant={someID} />
`,
			snapshot: `
declare const someID: string;
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
		`
declare const CustomComponent: (props: Record<string, unknown>) => unknown;
<CustomComponent />`,
		`
declare const CustomComponent: (props: Record<string, unknown>) => unknown;
declare const someID: string;
<CustomComponent aria-activedescendant={someID} />`,
		`
declare const CustomComponent: (props: Record<string, unknown>) => unknown;
declare const someID: string;
<CustomComponent aria-activedescendant={someID} tabIndex={0} />`,
		`<div />`,
		`<input />`,
		`<div tabIndex={0} />`,
		`
declare const someID: string;
<div aria-activedescendant={someID} tabIndex={0} />`,
		`
declare const someID: string;
<div aria-activedescendant={someID} tabIndex="0" />`,
		`
declare const someID: string;
<div aria-activedescendant={someID} tabIndex={1} />`,
		`
declare const someID: string;
<div aria-activedescendant={someID} tabIndex={-1} />`,
		`
declare const someID: string;
<input aria-activedescendant={someID} />`,
		`
declare const someID: string;
<button aria-activedescendant={someID} />`,
	],
});
