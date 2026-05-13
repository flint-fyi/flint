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
		`<div onClick={() => {}} onKeyDown={handler} />`,
		`<div onClick={() => {}} onKeyUp={handler} />`,
		`<div onClick={() => {}} onKeyPress={handler} />`,
		`<button onClick={() => {}} />`,
		`<div onClick={() => {}} aria-hidden="true" />`,
		`<div />`,
		`<input onClick={() => {}} />`,
		`<CustomElement onClick={() => {}} />`,
	],
});
