import rule from "./interactiveElementRoles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<button role="article" />
`,
			snapshot: `
<button role="article" />
        ~~~~~~~~~~~~~~
        Interactive element <button> should not have the non-interactive role \`'article'\`.
`,
		},
		{
			code: `
<a role="img" />
`,
			snapshot: `
<a role="img" />
   ~~~~~~~~~~
   Interactive element <a> should not have the non-interactive role \`'img'\`.
`,
		},
		{
			code: `
<input role="navigation" />
`,
			snapshot: `
<input role="navigation" />
       ~~~~~~~~~~~~~~~~~
       Interactive element <input> should not have the non-interactive role \`'navigation'\`.
`,
		},
		{
			code: `
<textarea role="tooltip" />
`,
			snapshot: `
<textarea role="tooltip" />
          ~~~~~~~~~~~~~~
          Interactive element <textarea> should not have the non-interactive role \`'tooltip'\`.
`,
		},
		{
			code: `
<select role="main" />
`,
			snapshot: `
<select role="main" />
        ~~~~~~~~~~~
        Interactive element <select> should not have the non-interactive role \`'main'\`.
`,
		},
		{
			code: `
<audio role="status" />
`,
			snapshot: `
<audio role="status" />
       ~~~~~~~~~~~~~
       Interactive element <audio> should not have the non-interactive role \`'status'\`.
`,
		},
		{
			code: `
<video role="presentation" />
`,
			snapshot: `
<video role="presentation" />
       ~~~~~~~~~~~~~~~~~~~
       Interactive element <video> should not have the non-interactive role \`'presentation'\`.
`,
		},
		{
			code: `
<details role="none" />
`,
			snapshot: `
<details role="none" />
         ~~~~~~~~~~~
         Interactive element <details> should not have the non-interactive role \`'none'\`.
`,
		},
	],
	valid: [
		{ code: `<button />` },
		{ code: `<button role="button" />` },
		{ code: `<a role="link" />` },
		{ code: `<input role="textbox" />` },
		{ code: `<div role="article" />` },
		{ code: `<CustomElement role="article" />` },
	],
});
