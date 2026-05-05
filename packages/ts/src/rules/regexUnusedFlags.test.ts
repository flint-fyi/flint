import rule from "./regexUnusedFlags.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/123/i;
`,
			output: `
/123/;
`,
			snapshot: `
/123/i;
     ~
     The \`i\` flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: `
/foo/m;
`,
			output: `
/foo/;
`,
			snapshot: `
/foo/m;
     ~
     The \`m\` flag has no effect because the pattern contains no line anchors.
`,
		},
		{
			code: `
/[0-9]+/s;
`,
			output: `
/[0-9]+/;
`,
			snapshot: `
/[0-9]+/s;
        ~
        The \`s\` flag has no effect because the pattern contains no dots.
`,
		},
		{
			code: `
/123/gi;
`,
			output: `
/123/g;
`,
			snapshot: `
/123/gi;
      ~
      The \`i\` flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: `
/123/ims;
`,
			output: `
/123/;
`,
			snapshot: `
/123/ims;
     ~
     The \`i\` flag has no effect because the pattern contains no letters.
      ~
      The \`m\` flag has no effect because the pattern contains no line anchors.
       ~
       The \`s\` flag has no effect because the pattern contains no dots.
`,
		},
		{
			code: `
new RegExp("123", "i");
`,
			output: `
new RegExp("123", "");
`,
			snapshot: `
new RegExp("123", "i");
                   ~
                   The \`i\` flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: `
RegExp("foo", "m");
`,
			output: `
RegExp("foo", "");
`,
			snapshot: `
RegExp("foo", "m");
               ~
               The \`m\` flag has no effect because the pattern contains no line anchors.
`,
		},
		{
			code: `
new RegExp("[0-9]", "gs");
`,
			output: `
new RegExp("[0-9]", "g");
`,
			snapshot: `
new RegExp("[0-9]", "gs");
                      ~
                      The \`s\` flag has no effect because the pattern contains no dots.
`,
		},
	],
	valid: [
		`/abc/i;`,
		`/[a-z]/i;`,
		`/^foo$/m;`,
		`/./s;`,
		`/foo.bar/s;`,
		`/123/;`,
		`/123/g;`,
		`new RegExp("abc", "i");`,
		`new RegExp("^foo$", "m");`,
		`RegExp(variable, "i");`,
		`new RegExp(pattern);`,
	],
});
