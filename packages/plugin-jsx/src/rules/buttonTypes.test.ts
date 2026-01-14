import rule from "./buttonTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<button>Click me</button>
`,
			snapshot: `
<button>Click me</button>
 ~~~~~~
 It is generally preferable to add an explicit \`type\` attribute to buttons.
`,
		},
		{
			code: `
<button />
`,
			snapshot: `
<button />
 ~~~~~~
 It is generally preferable to add an explicit \`type\` attribute to buttons.
`,
		},
		{
			code: `
<button onClick={handleClick}>Submit</button>
`,
			snapshot: `
<button onClick={handleClick}>Submit</button>
 ~~~~~~
 It is generally preferable to add an explicit \`type\` attribute to buttons.
`,
		},
		{
			code: `
<button type="invalid">Click</button>
`,
			snapshot: `
<button type="invalid">Click</button>
        ~~~~~~~~~~~~~~
        Button type 'invalid' is invalid. Use 'button', 'submit', or 'reset'.
`,
		},
		{
			code: `
<button type={"wrong"}>Click</button>
`,
			snapshot: `
<button type={"wrong"}>Click</button>
        ~~~~~~~~~~~~~~
        Button type 'wrong' is invalid. Use 'button', 'submit', or 'reset'.
`,
		},
	],
	valid: [
		{ code: `<div />` },
		{ code: `<button type="button">Click</button>` },
		{ code: `<button type="submit">Submit</button>` },
		{ code: `<button type="reset">Reset</button>` },
		{ code: `<button type={"button"}>Click</button>` },
		{ code: `<button type="button" />` },
		{ code: `<input type="button" />` },
		{ code: `<a href="#">Link</a>` },
	],
});
