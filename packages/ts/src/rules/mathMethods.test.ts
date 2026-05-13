import rule from "./mathMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = Math.log(x) * Math.LOG10E;
`,
			snapshot: `
const value = Math.log(x) * Math.LOG10E;
              ~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.log(…) * Math.LOG10E\`.
`,
		},
		{
			code: `
const value = Math.LOG10E * Math.log(x);
`,
			snapshot: `
const value = Math.LOG10E * Math.log(x);
              ~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.LOG10E * Math.log(…)\`.
`,
		},
		{
			code: `
const value = Math.log(x) * Math.LOG2E;
`,
			snapshot: `
const value = Math.log(x) * Math.LOG2E;
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log2(…)\` over \`Math.log(…) * Math.LOG2E\`.
`,
		},
		{
			code: `
const value = Math.LOG2E * Math.log(x);
`,
			snapshot: `
const value = Math.LOG2E * Math.log(x);
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log2(…)\` over \`Math.LOG2E * Math.log(…)\`.
`,
		},
		{
			code: `
const value = Math.log(x) / Math.LN10;
`,
			snapshot: `
const value = Math.log(x) / Math.LN10;
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.log(…) / Math.LN10\`.
`,
		},
		{
			code: `
const value = Math.log(x) / Math.LN2;
`,
			snapshot: `
const value = Math.log(x) / Math.LN2;
              ~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log2(…)\` over \`Math.log(…) / Math.LN2\`.
`,
		},
		{
			code: `
const value = Math.sqrt(x ** 2);
`,
			snapshot: `
const value = Math.sqrt(x ** 2);
              ~~~~~~~~~~~~~~~~~
              Prefer \`Math.abs(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(x * x);
`,
			snapshot: `
const value = Math.sqrt(x * x);
              ~~~~~~~~~~~~~~~~
              Prefer \`Math.abs(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(x ** 2 + y ** 2);
`,
			snapshot: `
const value = Math.sqrt(x ** 2 + y ** 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(x * x + y * y);
`,
			snapshot: `
const value = Math.sqrt(x * x + y * y);
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
`,
			snapshot: `
const value = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = Math.sqrt((a) ** 2 + (b) ** 2);
`,
			snapshot: `
const value = Math.sqrt((a) ** 2 + (b) ** 2);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.hypot(…)\` over \`Math.sqrt(…)\`.
`,
		},
		{
			code: `
const value = (Math.log(x)) * (Math.LOG10E);
`,
			snapshot: `
const value = (Math.log(x)) * (Math.LOG10E);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Math.log10(…)\` over \`Math.log(…) * Math.LOG10E\`.
`,
		},
	],
	valid: [
		`const value = Math.log10(x);`,
		`const value = Math.log2(x);`,
		`const value = Math.abs(x);`,
		`const value = Math.hypot(x, y);`,
		`const value = Math.log(x);`,
		`const value = Math.sqrt(x);`,
		`const value = Math.sqrt(x + y);`,
		`const value = Math.sqrt(x ** 3);`,
		`const value = Math.sqrt(x ** 2 + y);`,
		`const value = Math.log(x) + Math.LOG10E;`,
		`const value = Math.log(x) - Math.LOG10E;`,
		`const value = x * Math.LOG10E;`,
		`const value = Math.log(x) * y;`,
		`const value = Math.log(x, y) * Math.LOG10E;`,
		`const value = Math?.log(x) * Math.LOG10E;`,
		`const value = Math.log?.(x) * Math.LOG10E;`,
		`const value = Math.log(...args) * Math.LOG10E;`,
	],
});
