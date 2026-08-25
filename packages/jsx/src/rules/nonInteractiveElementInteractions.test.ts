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
declare const handler: (...args: unknown[]) => unknown;
<main onKeyDown={handler} />
`,
			snapshot: `
declare const handler: (...args: unknown[]) => unknown;
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
declare const handler: (...args: unknown[]) => unknown;
<img onClick={handler} />
`,
			snapshot: `
declare const handler: (...args: unknown[]) => unknown;
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
declare const handler: (...args: unknown[]) => unknown;
<ul onKeyPress={handler} />
`,
			snapshot: `
declare const handler: (...args: unknown[]) => unknown;
<ul onKeyPress={handler} />
 ~~
 \`<ul>\` elements are non-interactive and so should not have interactive event handlers.
`,
		},
		{
			code: `
declare const handler: (...args: unknown[]) => unknown;
<section onClick={handler} role="article" />
`,
			snapshot: `
declare const handler: (...args: unknown[]) => unknown;
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
		`
declare const CustomElement: (props: Record<string, unknown>) => unknown;
<CustomElement onClick={() => {}} />`,
	],
});
