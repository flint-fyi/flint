import rule from "./roleRedundancies.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<button role="button" />
`,
			snapshot: `
<button role="button" />
        ~~~~~~~~~~~~~
        \`<button>\` elements already implicitly have a role of \`button\`. This explicit role is unnecessary.
`,
			suggestions: [
				{
					id: "removeRole",
					updated: `
<button  />
`,
				},
			],
		},
		{
			code: `
<img role="img" src="/image.jpg" />
`,
			snapshot: `
<img role="img" src="/image.jpg" />
     ~~~~~~~~~~
     \`<img>\` elements already implicitly have a role of \`img\`. This explicit role is unnecessary.
`,
			suggestions: [
				{
					id: "removeRole",
					updated: `
<img  src="/image.jpg" />
`,
				},
			],
		},
		{
			code: `
<nav role="navigation" />
`,
			snapshot: `
<nav role="navigation" />
     ~~~~~~~~~~~~~~~~~
     \`<nav>\` elements already implicitly have a role of \`navigation\`. This explicit role is unnecessary.
`,
			suggestions: [
				{
					id: "removeRole",
					updated: `
<nav  />
`,
				},
			],
		},
		{
			code: `
<main role="main" style="" />
`,
			snapshot: `
<main role="main" style="" />
      ~~~~~~~~~~~
      \`<main>\` elements already implicitly have a role of \`main\`. This explicit role is unnecessary.
`,
			suggestions: [
				{
					id: "removeRole",
					updated: `
<main  style="" />
`,
				},
			],
		},
	],
	valid: [
		{ code: `<div />` },
		{ code: `<button role="presentation" />` },
		{ code: `<div role="button" />` },
		{ code: `<img src="/image.jpg" />` },
		{ code: `<nav />` },
		{ code: `<button />` },
	],
});
