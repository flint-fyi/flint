import rule from "./rawSpecialElements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<head>
  <title>Title</title>
</head>
			
`,
			snapshot: `
<head>
 ~~~~
 Use \`svelte:head\` instead of raw \`head\` for this special Svelte element.
  <title>Title</title>
</head>
			
`,
		},
		{
			code: `
<body></body>
			
`,
			snapshot: `
<body></body>
 ~~~~
 Use \`svelte:body\` instead of raw \`body\` for this special Svelte element.
			
`,
		},
		{
			code: `
<window></window>
			
`,
			snapshot: `
<window></window>
 ~~~~~~
 Use \`svelte:window\` instead of raw \`window\` for this special Svelte element.
			
`,
		},
		{
			code: `
<document></document>
			
`,
			snapshot: `
<document></document>
 ~~~~~~~~
 Use \`svelte:document\` instead of raw \`document\` for this special Svelte element.
			
`,
		},
		{
			code: `
<element></element>
			
`,
			snapshot: `
<element></element>
 ~~~~~~~
 Use \`svelte:element\` instead of raw \`element\` for this special Svelte element.
			
`,
		},
		{
			code: `
<options></options>
			
`,
			snapshot: `
<options></options>
 ~~~~~~~
 Use \`svelte:options\` instead of raw \`options\` for this special Svelte element.
			
`,
		},
	],
	valid: [
		"<div></div>",
		"<svelte:head></svelte:head>",
		"<svelte:body></svelte:body>",
		"<svelte:window></svelte:window>",
		"<svelte:document></svelte:document>",
		"<svelte:element this={{}}></svelte:element>",
		"<svelte:options></svelte:options>",
	],
});
