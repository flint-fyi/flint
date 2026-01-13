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
		{ code: `<label htmlFor="name">Name</label>` },
		{ code: `<label htmlFor="name" />` },
		{ code: `<label htmlFor={nameId}>Name</label>` },
		{
			code: `<label>Name <input type="text" /></label>`,
		},
		{ code: `<label><input type="text" /></label>` },
		{ code: `<label><select></select></label>` },
		{ code: `<label><textarea></textarea></label>` },
		{
			code: `<label><div><input type="text" /></div></label>`,
		},
		{ code: `<label><meter value={0.5} /></label>` },
		{ code: `<label><output>Result</output></label>` },
		{
			code: `<label><progress value={50} max={100} /></label>`,
		},
		{ code: `<div>Not a label</div>` },
	],
});
