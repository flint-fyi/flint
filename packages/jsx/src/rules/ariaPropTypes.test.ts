import rule from "./ariaPropTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div aria-hidden="yes" />
`,
			snapshot: `
<div aria-hidden="yes" />
                 ~~~~~
                 \`aria-hidden\` should have a value of true, false, or mixed, but received \`yes\`.
`,
		},
		{
			code: `
<input aria-checked="1" />
`,
			snapshot: `
<input aria-checked="1" />
                    ~~~
                    \`aria-checked\` should have a value of true, false, or mixed, but received \`1\`.
`,
		},
		{
			code: `
<div aria-level="low" />
`,
			snapshot: `
<div aria-level="low" />
                ~~~~~
                \`aria-level\` should have a value of an integer, but received \`low\`.
`,
		},
		{
			code: `
<div aria-valuemax="high" />
`,
			snapshot: `
<div aria-valuemax="high" />
                   ~~~~~~
                   \`aria-valuemax\` should have a value of a number, but received \`high\`.
`,
		},
		{
			code: `
<button aria-pressed="yes" />
`,
			snapshot: `
<button aria-pressed="yes" />
                     ~~~~~
                     \`aria-pressed\` should have a value of true, false, or mixed, but received \`yes\`.
`,
		},
		{
			code: `
<div aria-autocomplete="invalid" />
`,
			snapshot: `
<div aria-autocomplete="invalid" />
                       ~~~~~~~~~
                       \`aria-autocomplete\` should have a value of one of: both, inline, list, none, but received \`invalid\`.
`,
		},
		{
			code: `
<div aria-live="loud" />
`,
			snapshot: `
<div aria-live="loud" />
               ~~~~~~
               \`aria-live\` should have a value of one of: assertive, off, polite, but received \`loud\`.
`,
		},
		{
			code: `
<div aria-orientation="diagonal" />
`,
			snapshot: `
<div aria-orientation="diagonal" />
                      ~~~~~~~~~~
                      \`aria-orientation\` should have a value of one of: horizontal, undefined, vertical, but received \`diagonal\`.
`,
		},
		{
			code: `
<div aria-level="2.5" />
`,
			snapshot: `
<div aria-level="2.5" />
                ~~~~~
                \`aria-level\` should have a value of an integer, but received \`2.5\`.
`,
		},
		{
			code: `
<div aria-disabled="disabled" />
`,
			snapshot: `
<div aria-disabled="disabled" />
                   ~~~~~~~~~~
                   \`aria-disabled\` should have a value of true or false, but received \`disabled\`.
`,
		},
	],
	valid: [
		{ code: `<div aria-hidden="true" />` },
		{ code: `<div aria-hidden="false" />` },
		{ code: `<div aria-hidden={true} />` },
		{ code: `<div aria-hidden={false} />` },
		{ code: `<input aria-checked="true" />` },
		{ code: `<input aria-checked="false" />` },
		{ code: `<input aria-checked="mixed" />` },
		{ code: `<input aria-checked={true} />` },
		{ code: `<input aria-checked={false} />` },
		{ code: `<div aria-level="1" />` },
		{ code: `<div aria-level="2" />` },
		{ code: `<div aria-level={3} />` },
		{ code: `<div aria-valuemax="100" />` },
		{ code: `<div aria-valuemax="100.5" />` },
		{ code: `<div aria-valuemax={100} />` },
		{ code: `<div aria-valuemax={100.5} />` },
		{ code: `<div aria-label="Submit form" />` },
		{ code: `<div aria-placeholder="Enter text" />` },
		{ code: `<button aria-pressed="true" />` },
		{ code: `<button aria-pressed="false" />` },
		{ code: `<button aria-pressed="mixed" />` },
		{ code: `<div aria-autocomplete="inline" />` },
		{ code: `<div aria-autocomplete="list" />` },
		{ code: `<div aria-autocomplete="both" />` },
		{ code: `<div aria-autocomplete="none" />` },
		{ code: `<div aria-live="polite" />` },
		{ code: `<div aria-live="assertive" />` },
		{ code: `<div aria-live="off" />` },
		{ code: `<div aria-orientation="horizontal" />` },
		{ code: `<div aria-orientation="vertical" />` },
		{ code: `<div aria-orientation="undefined" />` },
		{ code: `<div aria-controls="id1 id2" />` },
		{ code: `<div aria-describedby="desc1" />` },
		{ code: `<div aria-labelledby="label1 label2" />` },
		{ code: `<div aria-activedescendant="item1" />` },
		{ code: `<div aria-current="page" />` },
		{ code: `<div aria-current="step" />` },
		{ code: `<div aria-current="true" />` },
		{ code: `<div aria-current="false" />` },
		{ code: `<div aria-invalid="true" />` },
		{ code: `<div aria-invalid="false" />` },
		{ code: `<div aria-invalid="grammar" />` },
		{ code: `<div aria-invalid="spelling" />` },
		{ code: `<div aria-haspopup="true" />` },
		{ code: `<div aria-haspopup="false" />` },
		{ code: `<div aria-haspopup="menu" />` },
		{ code: `<div aria-haspopup="listbox" />` },
		{ code: `<div aria-sort="ascending" />` },
		{ code: `<div aria-sort="descending" />` },
		{ code: `<div aria-sort="none" />` },
		{ code: `<div aria-sort="other" />` },
		{ code: `<div />` },
		{ code: `<input />` },
		{ code: `<div aria-expanded={isExpanded} />` },
		{ code: `<div aria-label={labelText} />` },
	],
});
