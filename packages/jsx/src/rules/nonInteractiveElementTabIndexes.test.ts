import rule from "./nonInteractiveElementTabIndexes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div tabIndex="0" />
`,
			snapshot: `
<div tabIndex="0" />
     ~~~~~~~~~~~~
     Non-interactive element \`<div>\` should not have an explicit, non-negative \`tabIndex\`.
`,
		},
		{
			code: `
<div tabIndex={0} />
`,
			snapshot: `
<div tabIndex={0} />
     ~~~~~~~~~~~~
     Non-interactive element \`<div>\` should not have an explicit, non-negative \`tabIndex\`.
`,
		},
		{
			code: `
<article tabIndex="0" />
`,
			snapshot: `
<article tabIndex="0" />
         ~~~~~~~~~~~~
         Non-interactive element \`<article>\` should not have an explicit, non-negative \`tabIndex\`.
`,
		},
		{
			code: `
<article tabIndex={0} />
`,
			snapshot: `
<article tabIndex={0} />
         ~~~~~~~~~~~~
         Non-interactive element \`<article>\` should not have an explicit, non-negative \`tabIndex\`.
`,
		},
		{
			code: `
<div role="article" tabIndex="0" />
`,
			snapshot: `
<div role="article" tabIndex="0" />
                    ~~~~~~~~~~~~
                    Non-interactive element \`<div>\` should not have an explicit, non-negative \`tabIndex\`.
`,
		},
	],
	valid: [
		{ code: `<div />` },
		{ code: `<button />` },
		{ code: `<button tabIndex="0" />` },
		{ code: `<button tabIndex={0} />` },
		{ code: `<div tabIndex="-1" />` },
		{ code: `<div tabIndex={-1} />` },
		{ code: `<div role="button" tabIndex="0" />` },
		{ code: `<article tabIndex="-1" />` },
		{ code: `<CustomElement tabIndex={0} />` },
	],
});
