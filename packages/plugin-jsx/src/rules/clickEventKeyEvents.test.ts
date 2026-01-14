import rule from "./clickEventKeyEvents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div onClick={() => {}} />
`,
			snapshot: `
<div onClick={() => {}} />
     ~~~~~~~
     This \`onClick\` is missing accompanying \`onKeyUp\`, \`onKeyDown\`, and/or \`onKeyPress\` keyboard events.
`,
		},
		{
			code: `
<span onClick={handler} />
`,
			snapshot: `
<span onClick={handler} />
      ~~~~~~~
      This \`onClick\` is missing accompanying \`onKeyUp\`, \`onKeyDown\`, and/or \`onKeyPress\` keyboard events.
`,
		},
	],
	valid: [
		{
			code: `<div onClick={() => {}} onKeyDown={handler} />`,
		},
		{
			code: `<div onClick={() => {}} onKeyUp={handler} />`,
		},
		{
			code: `<div onClick={() => {}} onKeyPress={handler} />`,
		},
		{ code: `<button onClick={() => {}} />` },
		{
			code: `<div onClick={() => {}} aria-hidden="true" />`,
		},
		{ code: `<div />` },
		{ code: `<input onClick={() => {}} />` },
		{
			code: `<CustomElement onClick={() => {}} />`,
		},
	],
});
