import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { domLibRuleTester } from "./ruleTester.ts";
import rule from "./tslintComments.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
// tslint:disable
const value = 1;
`,
			snapshot: `
// tslint:disable
~~~~~~~~~~~~~~~~~
TSLint is deprecated and its comments are no longer necessary.
const value = 1;
`,
		},
		{
			code: `
// tslint:enable
const value = 1;
`,
			snapshot: `
// tslint:enable
~~~~~~~~~~~~~~~~
TSLint is deprecated and its comments are no longer necessary.
const value = 1;
`,
		},
		{
			code: `
const value = 1; // tslint:disable-line
`,
			snapshot: `
const value = 1; // tslint:disable-line
                 ~~~~~~~~~~~~~~~~~~~~~~
                 TSLint is deprecated and its comments are no longer necessary.
`,
		},
		{
			code: `
// tslint:disable-next-line
const value = 1;
`,
			snapshot: `
// tslint:disable-next-line
~~~~~~~~~~~~~~~~~~~~~~~~~~~
TSLint is deprecated and its comments are no longer necessary.
const value = 1;
`,
		},
		{
			code: `
/* tslint:disable:no-console */
console.log("hello");
`,
			snapshot: `
/* tslint:disable:no-console */
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
TSLint is deprecated and its comments are no longer necessary.
console.log("hello");
`,
		},
		{
			code: `const value = /* tslint:disable */ 1;`,
			snapshot: `const value = /* tslint:disable */ 1;
              ~~~~~~~~~~~~~~~~~~~~
              TSLint is deprecated and its comments are no longer necessary.`,
		},
		{
			code: `
// tslint:disable no-console no-debugger
const value = 1;
`,
			snapshot: `
// tslint:disable no-console no-debugger
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
TSLint is deprecated and its comments are no longer necessary.
const value = 1;
`,
		},
	],
	valid: [
		`// Regular comment`,
		`const value = 1;`,
		`const pattern = /[/* tslint:disable]/;`,
		`const input = 1; const value = \`a \${input} /* tslint:disable */\`;`,
		{
			code: `const value = <div>/* tslint:disable */</div>;`,
			fileName: "file.tsx",
			files: {
				"global.d.ts": `
declare namespace JSX {
    interface IntrinsicElements {
        div: {};
    }
}
`,
				...createRuleTesterTSConfig({ jsx: "preserve" }),
			},
		},
		`// This comment mentions tslint but is not a directive`,
		`// TODO: migrate from tslint to eslint`,
		`// The tslint:disable format is explained here`,
	],
});
