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
		{ code: `<div aria-hidden="true" />` },
		{ code: `<img aria-hidden="true" />` },
		{ code: `<a aria-hidden="false" href="#" />` },
		{
			code: `<button aria-hidden="true" tabIndex="-1" />`,
		},
		{ code: `<a href="/" />` },
		{ code: `<div aria-hidden="false" tabIndex="0" />` },
		{ code: `<button />` },
	],
});
