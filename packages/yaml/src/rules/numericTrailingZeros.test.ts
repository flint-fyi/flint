import rule from "./numericTrailingZeros.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
value: 1.50
`,
			snapshot: `
value: 1.50
       ~~~~
       Numeric value has unnecessary trailing zeros.
`,
		},
		{
			code: `
price: 10.00
`,
			snapshot: `
price: 10.00
       ~~~~~
       Numeric value has unnecessary trailing zeros.
`,
		},
		{
			code: `
rate: 0.100
`,
			snapshot: `
rate: 0.100
      ~~~~~
      Numeric value has unnecessary trailing zeros.
`,
		},
	],
	valid: [
		`value: 1.5`,
		`price: 10`,
		`rate: 0.1`,
		`whole: 100`,
		`text: "1.50"`,
		`version: 1.0.0`,
	],
});
