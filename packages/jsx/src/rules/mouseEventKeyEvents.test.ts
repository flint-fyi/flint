import rule from "./mouseEventKeyEvents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div onMouseOver={() => void 0} />
`,
			snapshot: `
<div onMouseOver={() => void 0} />
     ~~~~~~~~~~~
     \`onMouseOver\` is missing an accompanying \`onFocus\` for keyboard accessibility.
`,
		},
		{
			code: `
<div onMouseOut={() => void 0} />
`,
			snapshot: `
<div onMouseOut={() => void 0} />
     ~~~~~~~~~~
     \`onMouseOut\` is missing an accompanying \`onBlur\` for keyboard accessibility.
`,
		},
		{
			code: `
<button onMouseOver={handler} />
`,
			snapshot: `
<button onMouseOver={handler} />
        ~~~~~~~~~~~
        \`onMouseOver\` is missing an accompanying \`onFocus\` for keyboard accessibility.
`,
		},
	],
	valid: [
		`<div onMouseOver={() => void 0} onFocus={() => void 0} />`,
		`<div onMouseOut={() => void 0} onBlur={() => void 0} />`,
		`<div onFocus={() => void 0} />`,
		`<div />`,
		`<button onClick={handler} />`,
	],
});
