import rule from "./roleSupportedAriaProps.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div role="button" aria-checked="true" />
`,
			snapshot: `
<div role="button" aria-checked="true" />
                   ~~~~~~~~~~~~
                   The \`aria-checked\` ARIA property is not supported by the \`button\` role.
`,
		},
		{
			code: `
<div role="link" aria-selected="true" />
`,
			snapshot: `
<div role="link" aria-selected="true" />
                 ~~~~~~~~~~~~~
                 The \`aria-selected\` ARIA property is not supported by the \`link\` role.
`,
		},
		{
			code: `
<button aria-checked="false" />
`,
			snapshot: `
<button aria-checked="false" />
        ~~~~~~~~~~~~
        The \`aria-checked\` ARIA property is not supported by the \`button\` role.
`,
		},
		{
			code: `
<div role="checkbox" aria-selected="true" />
`,
			snapshot: `
<div role="checkbox" aria-selected="true" />
                     ~~~~~~~~~~~~~
                     The \`aria-selected\` ARIA property is not supported by the \`checkbox\` role.
`,
		},
		{
			code: `
<img aria-checked="true" />
`,
			snapshot: `
<img aria-checked="true" />
     ~~~~~~~~~~~~
     The \`aria-checked\` ARIA property is not supported by the \`img\` role.
`,
		},
	],
	valid: [
		`<div role="button" aria-pressed="true" />`,
		`<button aria-pressed="true" />`,
		`<div role="checkbox" aria-checked="true" />`,
		`<div role="checkbox" aria-required="true" />`,
		`<div role="link" aria-label="Click here" />`,
		`<button aria-label="Submit" />`,
		`<div aria-label="Section" />`,
		`<div />`,
		`<button />`,
	],
});
