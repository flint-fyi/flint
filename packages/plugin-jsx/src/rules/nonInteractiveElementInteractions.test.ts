import rule from "./nonInteractiveElementInteractions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<h1 onClick={() => {}} />
`,
			snapshot: `
<h1 onClick={() => {}} />
 ~~
 \`<h1>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
		{
			code: `
<main onKeyDown={handler} />
`,
			snapshot: `
<main onKeyDown={handler} />
 ~~~~
 \`<main>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
		{
			code: `
<p onMouseDown={() => {}} />
`,
			snapshot: `
<p onMouseDown={() => {}} />
 ~
 \`<p>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
		{
			code: `
<img onClick={handler} />
`,
			snapshot: `
<img onClick={handler} />
 ~~~
 \`<img>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
		{
			code: `
<li onClick={() => {}} />
`,
			snapshot: `
<li onClick={() => {}} />
 ~~
 \`<li>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
		{
			code: `
<ul onKeyPress={handler} />
`,
			snapshot: `
<ul onKeyPress={handler} />
 ~~
 \`<ul>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
		{
			code: `
<section onClick={handler} role="article" />
`,
			snapshot: `
<section onClick={handler} role="article" />
 ~~~~~~~
 \`<section>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
	],
	valid: [
		{ code: `<h1 />` },
		{ code: `<main />` },
		{ code: `<p>Some text</p>` },
		{ code: `<button onClick={() => {}} />` },
		{ code: `<a onClick={() => {}} />` },
		{ code: `<input onClick={() => {}} />` },
		{ code: `<div onClick={() => {}} role="button" />` },
		{ code: `<h1 onClick={() => {}} role="button" />` },
		{ code: `<li onClick={() => {}} role="menuitem" />` },
		{
			code: `<span onClick={() => {}} role="checkbox" />`,
		},
		{ code: `<CustomElement onClick={() => {}} />` },
	],
});
