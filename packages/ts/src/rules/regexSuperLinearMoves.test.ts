import rule from "./regexSuperLinearMoves.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a*b/;
`,
			snapshot: `
/a*b/;
 ~~
 This quantifier can cause quadratic regex matching time. An input like \`aaaaaaaaaaaaaaaaaaaa\` could trigger slow matching.
`,
		},
		{
			code: String.raw`
/(?:\s*)foo/;
`,
			snapshot: `
/(?:\\s*)foo/;
    ~~~
    This quantifier can cause quadratic regex matching time. An input like \`                    \` could trigger slow matching.
`,
		},
		{
			code: `
new RegExp("a*b");
`,
			snapshot: `
new RegExp("a*b");
            ~~
            This quantifier can cause quadratic regex matching time. An input like \`aaaaaaaaaaaaaaaaaaaa\` could trigger slow matching.
`,
		},
		{
			code: String.raw`
/\w*\b/;
`,
			snapshot: `
/\\w*\\b/;
 ~~~
 This quantifier can cause quadratic regex matching time. An input like \`aaaaaaaaaaaaaaaaaaaa\` could trigger slow matching.
`,
		},
		{
			code: `
/.*:/;
`,
			snapshot: `
/.*:/;
 ~~
 This quantifier can cause quadratic regex matching time. An input like \`xxxxxxxxxxxxxxxxxxxx\` could trigger slow matching.
`,
		},
	],
	valid: [
		`/^a*b/;`,
		`/x+a*b/;`,
		`/a*/;`,
		String.raw`/a*[\s\S]*/;`,
		`RegExp(variable);`,
		`/^\\s+foo/;`,
		`/(a)?b/;`,
		`/a{0,5}b/;`,
		`/a+b/;`,
		String.raw`/\s+foo/;`,
	],
});
