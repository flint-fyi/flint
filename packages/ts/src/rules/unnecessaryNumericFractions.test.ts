import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryNumericFractions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1.0;
`,
			output: `
const value = 1;
`,
			snapshot: `
const value = 1.0;
              ~~~
              Prefer \`1\` over \`1.0\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 1.;
`,
			output: `
const value = 1;
`,
			snapshot: `
const value = 1.;
              ~~
              Prefer \`1\` over \`1.\` to avoid a dangling dot.
`,
		},
		{
			code: `
const value = 1.00;
`,
			output: `
const value = 1;
`,
			snapshot: `
const value = 1.00;
              ~~~~
              Prefer \`1\` over \`1.00\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 1.000;
`,
			output: `
const value = 1;
`,
			snapshot: `
const value = 1.000;
              ~~~~~
              Prefer \`1\` over \`1.000\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 1.0000;
`,
			output: `
const value = 1;
`,
			snapshot: `
const value = 1.0000;
              ~~~~~~
              Prefer \`1\` over \`1.0000\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 13.0;
`,
			output: `
const value = 13;
`,
			snapshot: `
const value = 13.0;
              ~~~~
              Prefer \`13\` over \`13.0\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 1.000_000;
`,
			output: `
const value = 1;
`,
			snapshot: `
const value = 1.000_000;
              ~~~~~~~~~
              Prefer \`1\` over \`1.000_000\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 1_000.000_000;
`,
			output: `
const value = 1_000;
`,
			snapshot: `
const value = 1_000.000_000;
              ~~~~~~~~~~~~~
              Prefer \`1_000\` over \`1_000.000_000\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 1.20000;
`,
			output: `
const value = 1.2;
`,
			snapshot: `
const value = 1.20000;
              ~~~~~~~
              Prefer \`1.2\` over \`1.20000\` to avoid an unnecessary zero fraction.
`,
		},
		{
			code: `
const value = 1.0e10;
`,
			output: `
const value = 1e10;
`,
			snapshot: `
const value = 1.0e10;
              ~~~~~~
              Prefer \`1e10\` over \`1.0e10\` to avoid an unnecessary zero fraction.
`,
		},
	],
	valid: [
		`const value = 1;`,
		`const value = 1.1;`,
		`const value = 123;`,
		`const value = 123.456;`,
		`const value = 0.1;`,
		`const value = 0.123;`,
		`const value = 1e10;`,
		`const value = 1e-10;`,
		`const value = 0xABCDEF;`,
		`const value = 0b10101;`,
		`const value = 0o7654321;`,
		`const value = 1_000;`,
		`const value = 1_000.123_456;`,
		`const value = 0.000_001;`,
		`const value = 1.00001;`,
	],
});
