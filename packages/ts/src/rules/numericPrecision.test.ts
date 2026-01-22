import rule from "./numericPrecision.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 9007199254740993;
`,
			snapshot: `
const value = 9007199254740993;
              ~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 5123000000000000000000000000001;
`,
			snapshot: `
const value = 5123000000000000000000000000001;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 1230000000000000000000000.0;
`,
			snapshot: `
const value = 1230000000000000000000000.0;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 0.1230000000000000000000000;
`,
			snapshot: `
const value = 0.1230000000000000000000000;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 2e999;
`,
			snapshot: `
const value = 2e999;
              ~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 0x20000000000001;
`,
			snapshot: `
const value = 0x20000000000001;
              ~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 0b100000000000000000000000000000000000000000000000000001;
`,
			snapshot: `
const value = 0b100000000000000000000000000000000000000000000000000001;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 1.0000000000000001;
`,
			snapshot: `
const value = 1.0000000000000001;
              ~~~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
		{
			code: `
const value = 9_007_199_254_740_993;
`,
			snapshot: `
const value = 9_007_199_254_740_993;
              ~~~~~~~~~~~~~~~~~~~~~
              This number literal will lose precision at runtime.
`,
		},
	],
	valid: [
		`const value = 12345;`,
		`const value = 123.456;`,
		`const value = 123e34;`,
		`const value = 0xABCDEF;`,
		`const value = 0b10101;`,
		`const value = 0o7654321;`,
		`const value = 9007199254740991;`,
		`const value = Number.MAX_SAFE_INTEGER;`,
		`const value = 1n;`,
		`const value = 9007199254740993n;`,
		`const value = 1.0;`,
		`const value = 1.00;`,
		`const value = 1.000;`,
		`const value = 0;`,
		`const value = 0.0;`,
		`const value = -0;`,
		`const value = 1e0;`,
	],
});
