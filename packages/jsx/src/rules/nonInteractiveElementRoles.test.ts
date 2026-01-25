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
		`<div />`,
		`<div role="presentation" />`,
		`<ul role="menu" />`,
		`<li role="menuitem" />`,
		`<table role="grid" />`,
		`<button role="button" />`,
		`<CustomElement role="button" />`,
	],
});
