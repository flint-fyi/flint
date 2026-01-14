import rule from "./booleanValues.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<button disabled={true}>Click me</button>
`,
			snapshot: `
<button disabled={true}>Click me</button>
        ~~~~~~~~~~~~~~~
        Prefer shorthand boolean attribute \`disabled\` over explicit \`disabled={true}\`.
`,
		},
		{
			code: `
<input type="text" required={true} />
`,
			snapshot: `
<input type="text" required={true} />
                   ~~~~~~~~~~~~~~~
                   Prefer shorthand boolean attribute \`required\` over explicit \`required={true}\`.
`,
		},
		{
			code: `
<Component isActive={true} />
`,
			snapshot: `
<Component isActive={true} />
           ~~~~~~~~~~~~~~~
           Prefer shorthand boolean attribute \`isActive\` over explicit \`isActive={true}\`.
`,
		},
		{
			code: `
<div hidden={true} aria-hidden={true}></div>
`,
			snapshot: `
<div hidden={true} aria-hidden={true}></div>
     ~~~~~~~~~~~~~
     Prefer shorthand boolean attribute \`hidden\` over explicit \`hidden={true}\`.
                   ~~~~~~~~~~~~~~~~~~
                   Prefer shorthand boolean attribute \`aria-hidden\` over explicit \`aria-hidden={true}\`.
`,
		},
	],
	valid: [
		{ code: `<button disabled>Click me</button>` },
		{ code: `<input type="text" required />` },
		{ code: `<Component isActive />` },
		{
			code: `<button disabled={false}>Click me</button>`,
		},
		{ code: `<input type="text" required={false} />` },
		{
			code: `<Component isActive={someCondition} />`,
		},
		{ code: `<button>Click me</button>` },
		{ code: `<div className="test" />` },
	],
});
