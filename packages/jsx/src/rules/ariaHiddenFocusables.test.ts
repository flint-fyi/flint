import rule from "./ariaHiddenFocusables.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div aria-hidden="true" tabIndex="0" />
`,
			snapshot: `
<div aria-hidden="true" tabIndex="0" />
     ~~~~~~~~~~~~~~~~~~
     This element has \`aria-hidden="true"\` but is focusable, which is misleading to users navigating with keyboards.
`,
		},
		{
			code: `
<input aria-hidden="true" />
`,
			snapshot: `
<input aria-hidden="true" />
       ~~~~~~~~~~~~~~~~~~
       This element has \`aria-hidden="true"\` but is focusable, which is misleading to users navigating with keyboards.
`,
		},
		{
			code: `
<a href="/" aria-hidden="true" />
`,
			snapshot: `
<a href="/" aria-hidden="true" />
            ~~~~~~~~~~~~~~~~~~
            This element has \`aria-hidden="true"\` but is focusable, which is misleading to users navigating with keyboards.
`,
		},
		{
			code: `
<button aria-hidden="true" />
`,
			snapshot: `
<button aria-hidden="true" />
        ~~~~~~~~~~~~~~~~~~
        This element has \`aria-hidden="true"\` but is focusable, which is misleading to users navigating with keyboards.
`,
		},
		{
			code: `
<textarea aria-hidden="true" />
`,
			snapshot: `
<textarea aria-hidden="true" />
          ~~~~~~~~~~~~~~~~~~
          This element has \`aria-hidden="true"\` but is focusable, which is misleading to users navigating with keyboards.
`,
		},
		{
			code: `
<div aria-hidden={true} tabIndex={0} />
`,
			snapshot: `
<div aria-hidden={true} tabIndex={0} />
     ~~~~~~~~~~~~~~~~~~
     This element has \`aria-hidden="true"\` but is focusable, which is misleading to users navigating with keyboards.
`,
		},
	],
	valid: [
		`<div aria-hidden="true" />`,
		`<img aria-hidden="true" />`,
		`<a aria-hidden="false" href="#" />`,
		`<button aria-hidden="true" tabIndex="-1" />`,
		`<a href="/" />`,
		`<div aria-hidden="false" tabIndex="0" />`,
		`<button />`,
	],
});
