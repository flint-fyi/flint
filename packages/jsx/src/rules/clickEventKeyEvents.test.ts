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
declare const handler: (...args: unknown[]) => unknown;
<span onClick={handler} />
`,
			snapshot: `
declare const handler: (...args: unknown[]) => unknown;
<span onClick={handler} />
      ~~~~~~~
      This \`onClick\` is missing accompanying \`onKeyUp\`, \`onKeyDown\`, and/or \`onKeyPress\` keyboard events.
`,
		},
	],
	valid: [
		`
declare const handler: (...args: unknown[]) => unknown;
<div onClick={() => {}} onKeyDown={handler} />`,
		`
declare const handler: (...args: unknown[]) => unknown;
<div onClick={() => {}} onKeyUp={handler} />`,
		`
declare const handler: (...args: unknown[]) => unknown;
<div onClick={() => {}} onKeyPress={handler} />`,
		`<button onClick={() => {}} />`,
		`<div onClick={() => {}} aria-hidden="true" />`,
		`<div />`,
		`<input onClick={() => {}} />`,
		`
declare const CustomElement: (props: Record<string, unknown>) => unknown;
<CustomElement onClick={() => {}} />`,
	],
});
