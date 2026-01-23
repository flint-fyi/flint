import rule from "./regexEmptyLookaroundsAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?=)/;
`,
			snapshot: `
/(?=)/;
 ~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/(?!)/;
`,
			snapshot: `
/(?!)/;
 ~~~~
 Empty lookahead will trivially reject all inputs.
`,
		},
		{
			code: `
/(?<=)/;
`,
			snapshot: `
/(?<=)/;
 ~~~~~
 Empty lookbehind will trivially accept all inputs.
`,
		},
		{
			code: `
/(?<!)/;
`,
			snapshot: `
/(?<!)/;
 ~~~~~
 Empty lookbehind will trivially reject all inputs.
`,
		},
		{
			code: `
/(?=|)/;
`,
			snapshot: `
/(?=|)/;
 ~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/a(?=)b/;
`,
			snapshot: `
/a(?=)b/;
  ~~~~
  Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
new RegExp("(?=)");
`,
			snapshot: `
new RegExp("(?=)");
            ~~~~
            Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/(?=a?)/;
`,
			snapshot: `
/(?=a?)/;
 ~~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/(?=a*)/;
`,
			snapshot: `
/(?=a*)/;
 ~~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/(?=(a)?)/;
`,
			snapshot: `
/(?=(a)?)/;
 ~~~~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/(?=(?:a)*)/;
`,
			snapshot: `
/(?=(?:a)*)/;
 ~~~~~~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/(?=^)/;
`,
			snapshot: `
/(?=^)/;
 ~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/(?=$)/;
`,
			snapshot: `
/(?=$)/;
 ~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: String.raw`
/(?=\b)/;
`,
			snapshot: String.raw`
/(?=\b)/;
 ~~~~~~
 Empty lookahead will trivially accept all inputs.
`,
		},
	],
	valid: [
		`/x(?=y)/;`,
		`/x(?!y)/;`,
		`/(?<=y)x/;`,
		`/(?<!y)x/;`,
		`/(?=a)/;`,
		`/(?!a)/;`,
		`/(?<=a)/;`,
		`/(?<!a)/;`,
		`/(?=a+)/;`,
		`/(?=[a-z])/;`,
		`new RegExp("(?=a)");`,
		`RegExp(variable);`,
	],
});
