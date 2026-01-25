import { ruleTester } from "./ruleTester.ts";
import rule from "./staticElementInteractions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div onClick={() => {}} />
`,
			snapshot: `
<div onClick={() => {}} />
 ~~~
 This static element that handles events is missing a role attribute.
`,
		},
		{
			code: `
<span onKeyDown={handler} />
`,
			snapshot: `
<span onKeyDown={handler} />
 ~~~~
 This static element that handles events is missing a role attribute.
`,
		},
		{
			code: `
<section onMouseDown={() => {}} />
`,
			snapshot: `
<section onMouseDown={() => {}} />
 ~~~~~~~
 This static element that handles events is missing a role attribute.
`,
		},
	],
	valid: [
		`<div onClick={() => {}} role="button" />`,
		`<span onKeyDown={handler} role="link" />`,
		`<button onClick={() => {}} />`,
		`<input onClick={() => {}} />`,
		`<div />`,
		`<a onClick={() => {}} />`,
		`<CustomElement onClick={() => {}} />`,
	],
});
