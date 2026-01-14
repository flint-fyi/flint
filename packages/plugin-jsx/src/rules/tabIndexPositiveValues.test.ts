import { ruleTester } from "./ruleTester.ts";
import rule from "./tabIndexPositiveValues.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<span tabIndex="5">foo</span>
`,
			snapshot: `
<span tabIndex="5">foo</span>
      ~~~~~~~~~~~~
      Positive \`tabIndex\` values disrupt tab order and make keyboard navigation unpredictable.
`,
		},
		{
			code: `
<span tabIndex="1">bar</span>
`,
			snapshot: `
<span tabIndex="1">bar</span>
      ~~~~~~~~~~~~
      Positive \`tabIndex\` values disrupt tab order and make keyboard navigation unpredictable.
`,
		},
		{
			code: `
<div tabIndex={3}>baz</div>
`,
			snapshot: `
<div tabIndex={3}>baz</div>
     ~~~~~~~~~~~~
     Positive \`tabIndex\` values disrupt tab order and make keyboard navigation unpredictable.
`,
		},
		{
			code: `
<button tabIndex={100}>Click</button>
`,
			snapshot: `
<button tabIndex={100}>Click</button>
        ~~~~~~~~~~~~~~
        Positive \`tabIndex\` values disrupt tab order and make keyboard navigation unpredictable.
`,
		},
	],
	valid: [
		{
			code: `
<span tabIndex="0">foo</span>`,
		},
		{
			code: `
<span tabIndex="-1">bar</span>`,
		},
		{
			code: `
<span tabIndex={0}>baz</span>`,
		},
		{
			code: `
<span tabIndex={-1}>qux</span>`,
		},
		{
			code: `
<div>no tabIndex</div>`,
		},
		{
			code: `
<button>Click me</button>`,
		},
	],
});
