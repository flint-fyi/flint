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
		{
			code: `
<div onClick={() => {}} role="button" />`,
		},
		{ code: `<span onKeyDown={handler} role="link" />` },
		{ code: `<button onClick={() => {}} />` },
		{ code: `<input onClick={() => {}} />` },
		{ code: `<div />` },
		{ code: `<a onClick={() => {}} />` },
		{ code: `<CustomElement onClick={() => {}} />` },
	],
});
