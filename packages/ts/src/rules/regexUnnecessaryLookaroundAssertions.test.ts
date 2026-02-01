import rule from "./regexUnnecessaryLookaroundAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?=a(?=b))/;
`,
			output: `
/(?=ab)/;
`,
			snapshot: `
/(?=a(?=b))/;
     ~~~~~
     This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?=a(?=b))/v;
`,
			output: `
/(?=ab)/v;
`,
			snapshot: `
/(?=a(?=b))/v;
     ~~~~~
     This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?=foo(?=bar))/;
`,
			output: `
/(?=foobar)/;
`,
			snapshot: `
/(?=foo(?=bar))/;
       ~~~~~~~
       This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?<=(?<=a)b)/;
`,
			output: `
/(?<=ab)/;
`,
			snapshot: `
/(?<=(?<=a)b)/;
     ~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: `
/(?<=(?<=foo)bar)/;
`,
			output: `
/(?<=foobar)/;
`,
			snapshot: `
/(?<=(?<=foo)bar)/;
     ~~~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: `
/(?=(?=abc))/;
`,
			output: `
/(?=abc)/;
`,
			snapshot: `
/(?=(?=abc))/;
    ~~~~~~~
    This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
/(?<=(?<=abc))/;
`,
			output: `
/(?<=abc)/;
`,
			snapshot: `
/(?<=(?<=abc))/;
     ~~~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: `
new RegExp("(?=a(?=b))");
`,
			output: `
new RegExp("(?=ab)");
`,
			snapshot: `
new RegExp("(?=a(?=b))");
                ~~~~~
                This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: `
RegExp("(?<=(?<=x)y)");
`,
			output: `
RegExp("(?<=xy)");
`,
			snapshot: `
RegExp("(?<=(?<=x)y)");
            ~~~~~~
            This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
		{
			code: String.raw`
/(?=\w(?=\d))/;
`,
			output: String.raw`
/(?=\w\d)/;
`,
			snapshot: String.raw`
/(?=\w(?=\d))/;
      ~~~~~~
      This lookahead assertion is unnecessary because it is at the end of another lookahead.
`,
		},
		{
			code: String.raw`
/(?<=(?<=\s)\w)/;
`,
			output: String.raw`
/(?<=\s\w)/;
`,
			snapshot: String.raw`
/(?<=(?<=\s)\w)/;
     ~~~~~~~
     This lookbehind assertion is unnecessary because it is at the start of another lookbehind.
`,
		},
	],
	valid: [
		`/(?=ab)/;`,
		`/(?<=ab)/;`,
		`/(?!a(?!b))/;`,
		`/(?<!(?<!a)b)/;`,
		`/(?=a)(?=b)/;`,
		`/(?<=a)(?<=b)/;`,
		`/(?=(?!b)a)/;`,
		`/(?<=a(?!b))/;`,
		`/(?=a(?<=b))/;`,
		`/(?<=(?=a)b)/;`,
		`RegExp(variable);`,
	],
});
