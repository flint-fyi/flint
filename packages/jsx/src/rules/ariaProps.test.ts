import rule from "./ariaProps.ts";
import { ruleTester } from "./ruleTester.ts";

// cspell:disable -- Testing misspellings of ARIA attributes
ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<input aria-labeledby="address_label" />
`,
			snapshot: `
<input aria-labeledby="address_label" />
       ~~~~~~~~~~~~~~
       \`aria-labeledby\` is not a valid ARIA property and so has no effect on the browser.
`,
		},
		{
			code: `
<div aria-invalid-prop="true" />
`,
			snapshot: `
<div aria-invalid-prop="true" />
     ~~~~~~~~~~~~~~~~~
     \`aria-invalid-prop\` is not a valid ARIA property and so has no effect on the browser.
`,
		},
		{
			code: `
<button aria-labelled="Submit" />
`,
			snapshot: `
<button aria-labelled="Submit" />
        ~~~~~~~~~~~~~
        \`aria-labelled\` is not a valid ARIA property and so has no effect on the browser.
`,
		},
	],
	valid: [
		`<input aria-labelledby="address_label" />`,
		`<div aria-label="Section" />`,
		`<button aria-pressed="true" />`,
		`<div aria-hidden="true" />`,
		`<input aria-required="true" />`,
		`<div />`,
		`<input data-aria-label="test" />`,
	],
});
