import rule from "./regexUnnecessaryLookaroundAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?=content(?=nested))/;
`,
			snapshot: `
/(?=content(?=nested))/;
           ~~~~~~~~~~
           This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?<=(?<=nested)content)/;
`,
			snapshot: `
/(?<=(?<=nested)content)/;
     ~~~~~~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: `
/(?!content(?=nested))/;
`,
			snapshot: `
/(?!content(?=nested))/;
           ~~~~~~~~~~
           This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?<!(?<=nested)content)/;
`,
			snapshot: `
/(?<!(?<=nested)content)/;
     ~~~~~~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: `
new RegExp("(?=content(?=nested))");
`,
			snapshot: `
new RegExp("(?=content(?=nested))");
                      ~~~~~~~~~~
                      This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
new RegExp("(?<=(?<=nested)content)");
`,
			snapshot: `
new RegExp("(?<=(?<=nested)content)");
                ~~~~~~~~~~~
                This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: `
/(?=first|second(?=nested))/;
`,
			snapshot: `
/(?=first|second(?=nested))/;
                ~~~~~~~~~~
                This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?<=(?<=nested)first|second)/;
`,
			snapshot: `
/(?<=(?<=nested)first|second)/;
     ~~~~~~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: `
/(?=(?=nested))/;
`,
			snapshot: `
/(?=(?=nested))/;
    ~~~~~~~~~~
    This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?<=(?<=nested))/;
`,
			snapshot: `
/(?<=(?<=nested))/;
     ~~~~~~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
	],
	valid: [
		`/(?=content(?!nested))/;`,
		`/(?<=(?<!nested)content)/;`,
		`/(?=(?=nested)content)/;`,
		`/(?<=content(?<=nested))/;`,
		`/(?=content)/;`,
		`/(?<=content)/;`,
		`new RegExp(variable);`,
		`/(?!content(?!nested))/;`,
		`/(?<!(?<!nested)content)/;`,
		`/value(?=test)/;`,
		`/(?<=test)value/;`,
	],
});
