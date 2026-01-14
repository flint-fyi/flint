import rule from "./ariaUnsupportedElements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<meta charset="UTF-8" aria-hidden="false" />
`,
			snapshot: `
<meta charset="UTF-8" aria-hidden="false" />
 ~~~~
 The \`meta\` element does not support ARIA roles, states, or properties.
`,
		},
		{
			code: `
<script role="application" />
`,
			snapshot: `
<script role="application" />
 ~~~~~~
 The \`script\` element does not support ARIA roles, states, or properties.
`,
		},
		{
			code: `
<style aria-label="styles" />
`,
			snapshot: `
<style aria-label="styles" />
 ~~~~~
 The \`style\` element does not support ARIA roles, states, or properties.
`,
		},
		{
			code: `
<html aria-required="true" />
`,
			snapshot: `
<html aria-required="true" />
 ~~~~
 The \`html\` element does not support ARIA roles, states, or properties.
`,
		},
	],
	valid: [
		{
			code: `<meta charset="UTF-8" />`,
		},
		{
			code: `<script src="app.js" />`,
		},
		{
			code: `<style>{css}</style>`,
		},
		{
			code: `<div role="button" />`,
		},
		{
			code: `<button aria-label="Click me" />`,
		},
	],
});
