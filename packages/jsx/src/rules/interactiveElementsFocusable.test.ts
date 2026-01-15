import rule from "./interactiveElementsFocusable.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div role="button" onClick={() => {}} />
`,
			snapshot: `
<div role="button" onClick={() => {}} />
     ~~~~~~~~~~~~~
     The 'button' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<span role="button" onClick={() => {}} />
`,
			snapshot: `
<span role="button" onClick={() => {}} />
      ~~~~~~~~~~~~~
      The 'button' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<div role="checkbox" onClick={() => {}} />
`,
			snapshot: `
<div role="checkbox" onClick={() => {}} />
     ~~~~~~~~~~~~~~~
     The 'checkbox' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<span role="link" onClick={() => {}} />
`,
			snapshot: `
<span role="link" onClick={() => {}} />
      ~~~~~~~~~~~
      The 'link' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<div role="menuitem" onKeyDown={() => {}} />
`,
			snapshot: `
<div role="menuitem" onKeyDown={() => {}} />
     ~~~~~~~~~~~~~~~
     The 'menuitem' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<div role="tab" onKeyPress={() => {}} />
`,
			snapshot: `
<div role="tab" onKeyPress={() => {}} />
     ~~~~~~~~~~
     The 'tab' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<div role="textbox" onKeyUp={() => {}} />
`,
			snapshot: `
<div role="textbox" onKeyUp={() => {}} />
     ~~~~~~~~~~~~~~
     The 'textbox' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<span role="switch" onMouseDown={() => {}} />
`,
			snapshot: `
<span role="switch" onMouseDown={() => {}} />
      ~~~~~~~~~~~~~
      The 'switch' role makes this element interactive, so it should also be focusable.
`,
		},
		{
			code: `
<div role="slider" onMouseUp={() => {}} />
`,
			snapshot: `
<div role="slider" onMouseUp={() => {}} />
     ~~~~~~~~~~~~~
     The 'slider' role makes this element interactive, so it should also be focusable.
`,
		},
	],
	valid: [
		{ code: `<button onClick={() => {}} />` },
		{ code: `<a href="#" onClick={() => {}} />` },
		{ code: `<input onClick={() => {}} />` },
		{ code: `<select onChange={() => {}} />` },
		{ code: `<textarea onChange={() => {}} />` },
		{
			code: `<div role="button" tabIndex={0} onClick={() => {}} />`,
		},
		{
			code: `<div role="button" tabIndex="-1" onClick={() => {}} />`,
		},
		{
			code: `<div role="button" tabIndex="0" onClick={() => {}} />`,
		},
		{
			code: `<span role="link" tabIndex={0} onClick={() => {}} />`,
		},
		{
			code: `<div role="checkbox" tabIndex={0} onClick={() => {}} />`,
		},
		{
			code: `<div onClick={() => {}} aria-hidden="true" />`,
		},
		{
			code: `<div onClick={() => {}} aria-hidden={true} />`,
		},
		{ code: `<button onClick={() => {}} disabled />` },
		{
			code: `<button onClick={() => {}} disabled={true} />`,
		},
		{
			code: `<div role="presentation" onClick={() => {}} />`,
		},
		{
			code: `<div role="none" onClick={() => {}} />`,
		},
		{ code: `<div onClick={() => {}} />` },
		{ code: `<span onClick={() => {}} />` },
		{
			code: `<div role="article" onClick={() => {}} />`,
		},
		{
			code: `<div role="banner" onClick={() => {}} />`,
		},
		{ code: `<div role="button" />` },
		{ code: `<button />` },
	],
});
