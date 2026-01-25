import rule from "./labelAssociatedControls.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<label />
`,
			snapshot: `
<label />
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
		{
			code: `
<label>Name</label>
`,
			snapshot: `
<label>Name</label>
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
		{
			code: `
<label><span>Name</span></label>
`,
			snapshot: `
<label><span>Name</span></label>
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
		{
			code: `
<label htmlFor="" />
`,
			snapshot: `
<label htmlFor="" />
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
		{
			code: `
<label htmlFor={''} />
`,
			snapshot: `
<label htmlFor={''} />
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
		{
			code: `
<label htmlFor={\`\`} />
`,
			snapshot: `
<label htmlFor={\`\`} />
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
		{
			code: `
<label htmlFor={undefined} />
`,
			snapshot: `
<label htmlFor={undefined} />
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
		{
			code: `
<label htmlFor={null} />
`,
			snapshot: `
<label htmlFor={null} />
 ~~~~~
 This <label> element is missing an associated control element.
`,
		},
	],
	valid: [
		`<label htmlFor="name">Name</label>`,
		`<label htmlFor="name" />`,
		`<label htmlFor={nameId}>Name</label>`,
		`<label>Name <input type="text" /></label>`,
		`<label><input type="text" /></label>`,
		`<label><select></select></label>`,
		`<label><textarea></textarea></label>`,
		`<label><div><input type="text" /></div></label>`,
		`<label><meter value={0.5} /></label>`,
		`<label><output>Result</output></label>`,
		`<label><progress value={50} max={100} /></label>`,
		`<div>Not a label</div>`,
	],
});
