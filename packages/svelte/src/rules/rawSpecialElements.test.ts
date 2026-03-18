import rule from "./rawSpecialElements.js";
import { ruleTester } from "./ruleTester.js";

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
 TODO: don't use \`head\` tag, use \`svelte:head\` instead
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
 TODO: don't use \`head\` tag, use \`svelte:head\` instead
			`,
		},
		{
			code: `
<window></window>
			`,
			snapshot: `
<body></body>
 ~~~~
 TODO: don't use \`head\` tag, use \`svelte:head\` instead
			`,
		},
		{
			code: `
<document></document>
			`,
			snapshot: `
<body></body>
 ~~~~
 TODO: don't use \`head\` tag, use \`svelte:head\` instead
			`,
		},
		{
			code: `
<element></element>
			`,
			snapshot: `
<body></body>
 ~~~~
 TODO: don't use \`head\` tag, use \`svelte:head\` instead
			`,
		},
		{
			code: `
<options></options>
			`,
			snapshot: `
<body></body>
 ~~~~
 TODO: don't use \`head\` tag, use \`svelte:head\` instead
			`,
		},
	],
	valid: [
		"<div></div>",
		"<svelte:head></svelte:head>",
		"<svelte:body></svelte:body>",
		"<svelte:window></svelte:window>",
		"<svelte:document></svelte:document>",
		"<svelte:element></svelte:element>",
		"<svelte:options></svelte:options>",
	],
});
