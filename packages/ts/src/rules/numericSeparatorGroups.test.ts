import rule from "./numericSeparatorGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1000000;
`,
			output: `
const value = 1_000_000;
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
			output: `
const value = 10_000;
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
			output: `
const value = 10_000;
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
			output: `
const value = 10_000;
`,
			snapshot: `
const value = 1_0000;
              ~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 123456.789012;
`,
			output: `
const value = 123_456.789_012;
`,
			snapshot: `
const value = 123456.789012;
              ~~~~~~~~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
		{
			code: `
const value = 10000n;
`,
			output: `
const value = 10_000n;
`,
			snapshot: `
const value = 10000n;
              ~~~~~~
              Use consistent grouping with numeric separators.
`,
		},
	],
	valid: [
		`1000;`,
		`1_000;`,
		`10_000;`,
		`100_000;`,
		`1_000_000;`,
		`0xFF;`,
		`0xFF_FF;`,
		`0xAB_CD_EF;`,
		`0b1111;`,
		`0b1111_1111;`,
		`0o7777;`,
		`0o7777_7777;`,
		`123_456.789_012;`,
		`1e10_000;`,
		`10_000n;`,
		`0xFF_FFn;`,
		`1.5;`,
		`0;`,
		`123;`,
		`const value = 123;`,
		`0b11111111`,
		`0o77777777`,
		`0xABCDEF`,
		`0xFFFF`,
		`0xFFFFn`,
		`1e10000`,
		`2.2250738585072014e-308`,
	],
});
