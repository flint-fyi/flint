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
		`<h1 />`,
		`<main />`,
		`<p>Some text</p>`,
		`<button onClick={() => {}} />`,
		`<a onClick={() => {}} />`,
		`<input onClick={() => {}} />`,
		`<div onClick={() => {}} role="button" />`,
		`<h1 onClick={() => {}} role="button" />`,
		`<li onClick={() => {}} role="menuitem" />`,
		`<span onClick={() => {}} role="checkbox" />`,
		`<CustomElement onClick={() => {}} />`,
	],
});
