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
		`<div aria-hidden="true" />`,
		`<div aria-hidden="false" />`,
		`<div aria-hidden={true} />`,
		`<div aria-hidden={false} />`,
		`<input aria-checked="true" />`,
		`<input aria-checked="false" />`,
		`<input aria-checked="mixed" />`,
		`<input aria-checked={true} />`,
		`<input aria-checked={false} />`,
		`<div aria-level="1" />`,
		`<div aria-level="2" />`,
		`<div aria-level={3} />`,
		`<div aria-valuemax="100" />`,
		`<div aria-valuemax="100.5" />`,
		`<div aria-valuemax={100} />`,
		`<div aria-valuemax={100.5} />`,
		`<div aria-label="Submit form" />`,
		`<div aria-placeholder="Enter text" />`,
		`<button aria-pressed="true" />`,
		`<button aria-pressed="false" />`,
		`<button aria-pressed="mixed" />`,
		`<div aria-autocomplete="inline" />`,
		`<div aria-autocomplete="list" />`,
		`<div aria-autocomplete="both" />`,
		`<div aria-autocomplete="none" />`,
		`<div aria-live="polite" />`,
		`<div aria-live="assertive" />`,
		`<div aria-live="off" />`,
		`<div aria-orientation="horizontal" />`,
		`<div aria-orientation="vertical" />`,
		`<div aria-orientation="undefined" />`,
		`<div aria-controls="id1 id2" />`,
		`<div aria-describedby="desc1" />`,
		`<div aria-labelledby="label1 label2" />`,
		`<div aria-activedescendant="item1" />`,
		`<div aria-current="page" />`,
		`<div aria-current="step" />`,
		`<div aria-current="true" />`,
		`<div aria-current="false" />`,
		`<div aria-invalid="true" />`,
		`<div aria-invalid="false" />`,
		`<div aria-invalid="grammar" />`,
		`<div aria-invalid="spelling" />`,
		`<div aria-haspopup="true" />`,
		`<div aria-haspopup="false" />`,
		`<div aria-haspopup="menu" />`,
		`<div aria-haspopup="listbox" />`,
		`<div aria-sort="ascending" />`,
		`<div aria-sort="descending" />`,
		`<div aria-sort="none" />`,
		`<div aria-sort="other" />`,
		`<div />`,
		`<input />`,
		`<div aria-expanded={isExpanded} />`,
		`<div aria-label={labelText} />`,
	],
});
