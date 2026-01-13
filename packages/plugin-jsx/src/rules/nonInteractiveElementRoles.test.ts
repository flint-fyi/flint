import rule from "./nonInteractiveElementRoles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<h1 role="button" />
`,
			snapshot: `
<h1 role="button" />
    ~~~~~~~~~~~~~
    Non-interactive element <h1> should not have the interactive role \`'button'\`.
`,
		},
		{
			code: `
<div role="link" />
`,
			snapshot: `
<div role="link" />
     ~~~~~~~~~~~
     Non-interactive element <div> should not have the interactive role \`'link'\`.
`,
		},
		{
			code: `
<img role="checkbox" />
`,
			snapshot: `
<img role="checkbox" />
     ~~~~~~~~~~~~~~~
     Non-interactive element <img> should not have the interactive role \`'checkbox'\`.
`,
		},
	],
	valid: [
		{ code: `<div />` },
		{ code: `<div role="presentation" />` },
		{ code: `<ul role="menu" />` },
		{ code: `<li role="menuitem" />` },
		{ code: `<table role="grid" />` },
		{ code: `<button role="button" />` },
		{ code: `<CustomElement role="button" />` },
	],
});
