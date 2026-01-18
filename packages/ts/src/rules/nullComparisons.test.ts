import rule from "./nullComparisons.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
value == null;
export {};
`,
			snapshot: `
value == null;
~~~~~~~~~~~~~
Use strict equality (\`===\` or \`!==\`) when comparing with null.
export {};
`,
		},
		{
			code: `
value != null;
export {};
`,
			snapshot: `
value != null;
~~~~~~~~~~~~~
Use strict equality (\`===\` or \`!==\`) when comparing with null.
export {};
`,
		},
		{
			code: `
null == value;
export {};
`,
			snapshot: `
null == value;
~~~~~~~~~~~~~
Use strict equality (\`===\` or \`!==\`) when comparing with null.
export {};
`,
		},
		{
			code: `
null != value;
export {};
`,
			snapshot: `
null != value;
~~~~~~~~~~~~~
Use strict equality (\`===\` or \`!==\`) when comparing with null.
export {};
`,
		},
		{
			code: `
if (value == null) {}
export {};
`,
			snapshot: `
if (value == null) {}
    ~~~~~~~~~~~~~
    Use strict equality (\`===\` or \`!==\`) when comparing with null.
export {};
`,
		},
		{
			code: `
(value) == (null);
export {};
`,
			snapshot: `
(value) == (null);
~~~~~~~~~~~~~~~~~
Use strict equality (\`===\` or \`!==\`) when comparing with null.
export {};
`,
		},
	],
	valid: [
		`value === null; export {};`,
		`value !== null; export {};`,
		`null === value; export {};`,
		`null !== value; export {};`,
		`value === undefined; export {};`,
		`value == undefined; export {};`,
		`value == 0; export {};`,
		`value == ""; export {};`,
		`value == false; export {};`,
	],
});
