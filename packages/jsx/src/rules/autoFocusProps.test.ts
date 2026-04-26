import rule from "./autoFocusProps.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div autoFocus />
`,
			snapshot: `
<div autoFocus />
     ~~~~~~~~~
     The \`autoFocus\` prop disruptively forces unintuitive focus behavior.
`,
		},
		{
			code: `
<div autoFocus={true} />
`,
			snapshot: `
<div autoFocus={true} />
     ~~~~~~~~~~~~~~~~
     The \`autoFocus\` prop disruptively forces unintuitive focus behavior.
`,
		},
		{
			code: `
<input autoFocus={undefined} />
`,
			snapshot: `
<input autoFocus={undefined} />
       ~~~~~~~~~~~~~~~~~~~~~
       The \`autoFocus\` prop disruptively forces unintuitive focus behavior.
`,
		},
	],
	valid: [
		`<div />`,
		`<div autoFocus="false" />`,
		// String literals are already caught by TypeScript as a type error, no need to double-report.
		`<div autoFocus="true" />`,
		`<div autoFocus={false} />`,
		`<input type="text" />`,
	],
});
