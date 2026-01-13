import { ruleTester } from "./ruleTester.ts";
import rule from "./scopeProps.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div scope />
`,
			snapshot: `
<div scope />
     ~~~~~
     The \`scope\` prop only has an effect on <th> elements.
`,
		},
		{
			code: `
<div scope="col" />
`,
			snapshot: `
<div scope="col" />
     ~~~~~~~~~~~
     The \`scope\` prop only has an effect on <th> elements.
`,
		},
		{
			code: `
<td scope="row" />
`,
			snapshot: `
<td scope="row" />
    ~~~~~~~~~~~
    The \`scope\` prop only has an effect on <th> elements.
`,
		},
		{
			code: `
<span scope={scope} />
`,
			snapshot: `
<span scope={scope} />
      ~~~~~~~~~~~~~
      The \`scope\` prop only has an effect on <th> elements.
`,
		},
	],
	valid: [
		{ code: `<th scope="col" />` },
		{ code: `<th scope="row" />` },
		{ code: `<th scope={scope} />` },
		{ code: `<div />` },
		{ code: `<td>Cell</td>` },
	],
});
