import rule from "./regexEmptyLookaroundsAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		// Basic empty lookarounds
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
		// Empty alternatives
		{
			code: `
/x(?=|)/;
`,
			snapshot: `
/x(?=|)/;
  ~~~~~
  Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/x(?!|)/;
`,
			snapshot: `
/x(?!|)/;
  ~~~~~
  Empty lookahead will trivially reject all inputs.
`,
		},
		{
			code: `
/(?<=|)x/;
`,
			snapshot: `
/(?<=|)x/;
 ~~~~~~
 Empty lookbehind will trivially accept all inputs.
`,
		},
		{
			code: `
/(?<!|)x/;
`,
			snapshot: `
/(?<!|)x/;
 ~~~~~~
 Empty lookbehind will trivially reject all inputs.
`,
		},
		// Empty alternatives with content
		{
			code: `
/x(?=y|)/;
`,
			snapshot: `
/x(?=y|)/;
  ~~~~~~
  Empty lookahead will trivially accept all inputs.
`,
		},
		{
			code: `
/x(?!y|)/;
`,
			snapshot: `
/x(?!y|)/;
  ~~~~~~
  Empty lookahead will trivially reject all inputs.
`,
		},
		{
			code: `
/(?<=y|)x/;
`,
			snapshot: `
/(?<=y|)x/;
 ~~~~~~~
 Empty lookbehind will trivially accept all inputs.
`,
		},
		{
			code: `
/(?<!y|)x/;
`,
			snapshot: `
/(?<!y|)x/;
 ~~~~~~~
 Empty lookbehind will trivially reject all inputs.
`,
		},
		// Quantifiers that allow zero length
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
/(?=a|b*)/;
`,
			snapshot: `
/(?=a|b*)/;
 ~~~~~~~~
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

		// Unicode sets flag with empty \q{}
		{
			code: String.raw`
/x(?=[\q{}])/v;
`,
			snapshot: String.raw`
/x(?=[\q{}])/v;
  ~~~~~~~~~~
  Empty lookahead will trivially accept all inputs.
`,
		},
	],
	valid: [
		// Basic valid lookarounds
		`/x(?=y)/;`,
		`/x(?!y)/;`,
		`/(?<=y)x/;`,
		`/(?<!y)x/;`,
		`/(?=a)/;`,
		`/(?!a)/;`,
		`/(?<=a)/;`,
		`/(?<!a)/;`,
		// Quantifiers that require at least one match
		`/(?=a+)/;`,
		`/(?=[a-z])/;`,
		// Constructor patterns
		`new RegExp("(?=a)");`,
		`RegExp(variable);`,
		// Groups/assertions that aren't capturing groups
		`/(^)x/;`,
		`/x($)/;`,
		// Nested lookarounds that are not empty
		`/(?=(?=.).*)/;`,
		// Lookaround with alternatives where at least one is non-empty
		`/(?=$|a)/;`,
		// Word boundary inside lookahead with content
		String.raw`/(?=\ba*\b)/;`,
		// Backreference
		String.raw`/b?r(#*)"(?:[^"]|"(?!\1))*"\1/;`,
		// Unicode sets with non-empty \q{}
		String.raw`/x(?=[\q{a}])/v;`,
	],
});
