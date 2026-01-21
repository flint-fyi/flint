import rule from "./numericSeparatorGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1000000;
`,
			snapshot: `
const value = 1000000;
              ~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 10000;
`,
			snapshot: `
const value = 10000;
              ~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 100_00;
`,
			snapshot: `
const value = 100_00;
              ~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 1_0000;
`,
			snapshot: `
const value = 1_0000;
              ~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 0xFFFF;
`,
			snapshot: `
const value = 0xFFFF;
              ~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 0xABCDEF;
`,
			snapshot: `
const value = 0xABCDEF;
              ~~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 0b11111111;
`,
			snapshot: `
const value = 0b11111111;
              ~~~~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 0o77777777;
`,
			snapshot: `
const value = 0o77777777;
              ~~~~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 123456.789012;
`,
			snapshot: `
const value = 123456.789012;
              ~~~~~~~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 1e10000;
`,
			snapshot: `
const value = 1e10000;
              ~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 10000n;
`,
			snapshot: `
const value = 10000n;
              ~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 0xFFFFn;
`,
			snapshot: `
const value = 0xFFFFn;
              ~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
	],
	valid: [
		`const value = 1000;`,
		`const value = 1_000;`,
		`const value = 10_000;`,
		`const value = 100_000;`,
		`const value = 1_000_000;`,
		`const value = 0xFF;`,
		`const value = 0xFF_FF;`,
		`const value = 0xAB_CD_EF;`,
		`const value = 0b1111;`,
		`const value = 0b1111_1111;`,
		`const value = 0o7777;`,
		`const value = 0o7777_7777;`,
		`const value = 123_456.789_012;`,
		`const value = 1e10_000;`,
		`const value = 10_000n;`,
		`const value = 0xFF_FFn;`,
		`const value = 1.5;`,
		`const value = 0;`,
		`const value = 123;`,
	],
});
