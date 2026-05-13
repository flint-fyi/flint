import rule from "./roleRequiredAriaProps.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div role="checkbox" />
`,
			snapshot: `
<div role="checkbox" />
     ~~~~~~~~~~~~~~~
     Elements with ARIA role \`checkbox\` must have the following ARIA property(s) defined: aria-checked.
`,
		},
		{
			code: `
<span role="combobox" />
`,
			snapshot: `
<span role="combobox" />
      ~~~~~~~~~~~~~~~
      Elements with ARIA role \`combobox\` must have the following ARIA property(s) defined: aria-controls, aria-expanded.
`,
		},
		{
			code: `
<div role="heading" />
`,
			snapshot: `
<div role="heading" />
     ~~~~~~~~~~~~~~
     Elements with ARIA role \`heading\` must have the following ARIA property(s) defined: aria-level.
`,
		},
		{
			code: `
<div role="menuitemcheckbox" />
`,
			snapshot: `
<div role="menuitemcheckbox" />
     ~~~~~~~~~~~~~~~~~~~~~~~
     Elements with ARIA role \`menuitemcheckbox\` must have the following ARIA property(s) defined: aria-checked.
`,
		},
		{
			code: `
<div role="menuitemradio" />
`,
			snapshot: `
<div role="menuitemradio" />
     ~~~~~~~~~~~~~~~~~~~~
     Elements with ARIA role \`menuitemradio\` must have the following ARIA property(s) defined: aria-checked.
`,
		},
		{
			code: `
<div role="option" />
`,
			snapshot: `
<div role="option" />
     ~~~~~~~~~~~~~
     Elements with ARIA role \`option\` must have the following ARIA property(s) defined: aria-selected.
`,
		},
		{
			code: `
<div role="radio" />
`,
			snapshot: `
<div role="radio" />
     ~~~~~~~~~~~~
     Elements with ARIA role \`radio\` must have the following ARIA property(s) defined: aria-checked.
`,
		},
		{
			code: `
<div role="scrollbar" />
`,
			snapshot: `
<div role="scrollbar" />
     ~~~~~~~~~~~~~~~~
     Elements with ARIA role \`scrollbar\` must have the following ARIA property(s) defined: aria-controls, aria-valuenow, aria-valuemax, aria-valuemin.
`,
		},
		{
			code: `
<div role="slider" />
`,
			snapshot: `
<div role="slider" />
     ~~~~~~~~~~~~~
     Elements with ARIA role \`slider\` must have the following ARIA property(s) defined: aria-valuenow, aria-valuemax, aria-valuemin.
`,
		},
		{
			code: `
<div role="spinbutton" />
`,
			snapshot: `
<div role="spinbutton" />
     ~~~~~~~~~~~~~~~~~
     Elements with ARIA role \`spinbutton\` must have the following ARIA property(s) defined: aria-valuenow, aria-valuemax, aria-valuemin.
`,
		},
		{
			code: `
<button role="switch" />
`,
			snapshot: `
<button role="switch" />
        ~~~~~~~~~~~~~
        Elements with ARIA role \`switch\` must have the following ARIA property(s) defined: aria-checked.
`,
		},
		{
			code: `
<div role="checkbox" aria-label="Accept terms" />
`,
			snapshot: `
<div role="checkbox" aria-label="Accept terms" />
     ~~~~~~~~~~~~~~~
     Elements with ARIA role \`checkbox\` must have the following ARIA property(s) defined: aria-checked.
`,
		},
		{
			code: `
<div role="slider" aria-valuenow="5" />
`,
			snapshot: `
<div role="slider" aria-valuenow="5" />
     ~~~~~~~~~~~~~
     Elements with ARIA role \`slider\` must have the following ARIA property(s) defined: aria-valuemax, aria-valuemin.
`,
		},
	],
	valid: [
		`<div role="checkbox" aria-checked="false" />`,
		`<div role="combobox" aria-controls="listbox" aria-expanded="false" />`,
		`<div role="heading" aria-level="2" />`,
		`<div role="menuitemcheckbox" aria-checked="true" />`,
		`<div role="menuitemradio" aria-checked="false" />`,
		`<div role="option" aria-selected="true" />`,
		`<div role="radio" aria-checked="true" />`,
		`<div role="scrollbar" aria-controls="content" aria-valuenow="50" aria-valuemax="100" aria-valuemin="0" />`,
		`<div role="slider" aria-valuenow="5" aria-valuemax="10" aria-valuemin="0" />`,
		`<div role="spinbutton" aria-valuenow="1" aria-valuemax="100" aria-valuemin="1" />`,
		`<button role="switch" aria-checked="false" />`,
		`<div role="button" />`,
		`<div role="link" />`,
		`<div role="gridcell" />`,
		`<div role="searchbox" />`,
		`<div role="separator" />`,
		`<div role="tab" />`,
		`<div role="tabpanel" />`,
		`<div role="textbox" />`,
		`<div role="treeitem" />`,
		`<div />`,
		`<button />`,
		`<CustomElement />`,
	],
});
