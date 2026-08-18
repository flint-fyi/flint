import rule from "./mathMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = Math.log(1) * Math.LOG10E;
`,
			snapshot: `
const value = Math.log(1) * Math.LOG10E;
              ~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.log(…) * Math.LOG10E\`.
`,
		},
		{
			code: `
const value = Math.LOG10E * Math.log(1);
`,
			snapshot: `
const value = Math.LOG10E * Math.log(1);
              ~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.LOG10E * Math.log(…)\`.
`,
		},
		{
			code: `
const value = Math.log(1) * Math.LOG2E;
`,
			snapshot: `
const value = Math.log(1) * Math.LOG2E;
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log2(…)\` over \`Math.log(…) * Math.LOG2E\`.
`,
		},
		{
			code: `
const value = Math.LOG2E * Math.log(1);
`,
			snapshot: `
const value = Math.LOG2E * Math.log(1);
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log2(…)\` over \`Math.LOG2E * Math.log(…)\`.
`,
		},
		{
			code: `
const value = Math.log(1) / Math.LN10;
`,
			snapshot: `
const value = Math.log(1) / Math.LN10;
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.log(…) / Math.LN10\`.
`,
		},
		{
			code: `
const value = Math.log(1) / Math.LN2;
`,
			snapshot: `
const value = Math.log(1) / Math.LN2;
              ~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log2(…)\` over \`Math.log(…) / Math.LN2\`.
`,
		},
		{
			code: `
const value = Math.sqrt(1 ** 2);
`,
			snapshot: `
const value = Math.sqrt(1 ** 2);
              ~~~~~~~~~~~~~~~~~
              Prefer \`Math.abs(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(1 * 1);
`,
			snapshot: `
const value = Math.sqrt(1 * 1);
              ~~~~~~~~~~~~~~~~
              Prefer \`Math.abs(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(1 ** 2 + 2 ** 2);
`,
			snapshot: `
const value = Math.sqrt(1 ** 2 + 2 ** 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(1 * 1 + 2 * 2);
`,
			snapshot: `
const value = Math.sqrt(1 * 1 + 2 * 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(1 ** 2 + 2 ** 2 + 3 ** 2);
`,
			snapshot: `
const value = Math.sqrt(1 ** 2 + 2 ** 2 + 3 ** 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt((1) ** 2 + (2) ** 2);
`,
			snapshot: `
const value = Math.sqrt((1) ** 2 + (2) ** 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = (Math.log(1)) * (Math.LOG10E);
`,
			snapshot: `
const value = (Math.log(1)) * (Math.LOG10E);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.log(…) * Math.LOG10E\`.
`,
		},
	],
	valid: [
		`const value = Math.log10(1);`,
		`const value = Math.log2(1);`,
		`const value = Math.abs(1);`,
		`const value = Math.hypot(1, 2);`,
		`const value = Math.log(1);`,
		`const value = Math.sqrt(1);`,
		`const value = Math.sqrt(1 + 2);`,
		`const value = Math.sqrt(1 ** 3);`,
		`const value = Math.sqrt(1 ** 2 + 2);`,
		`const value = Math.log(1) + Math.LOG10E;`,
		`const value = Math.log(1) - Math.LOG10E;`,
		`const value = 1 * Math.LOG10E;`,
		`const value = Math.log(1) * 2;`,
		`const value = Math?.log(1) * Math.LOG10E;`,
		`const value = Math.log?.(1) * Math.LOG10E;`,
		`
const args = [1] as const;
const value = Math.log(...args) * Math.LOG10E;
`,
	],
});
