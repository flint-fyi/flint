import rule from "./regexUnusedFlags.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/123/i;
`,
			snapshot: String.raw`
/123/i;
     ~
     The 'i' flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: String.raw`
/\d+/i;
`,
			snapshot: String.raw`
/\d+/i;
     ~
     The 'i' flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: String.raw`
/abc/m;
`,
			snapshot: String.raw`
/abc/m;
     ~
     The 'm' flag has no effect because the pattern contains no line anchors.
`,
		},
		{
			code: String.raw`
/abc/s;
`,
			snapshot: String.raw`
/abc/s;
     ~
     The 's' flag has no effect because the pattern contains no dots.
`,
		},
		{
			code: String.raw`
/a\.b/s;
`,
			snapshot: String.raw`
/a\.b/s;
      ~
      The 's' flag has no effect because the pattern contains no dots.
`,
		},
		{
			code: String.raw`
/123/ims;
`,
			snapshot: String.raw`
/123/ims;
     ~
     The 'i' flag has no effect because the pattern contains no letters.
      ~
      The 'm' flag has no effect because the pattern contains no line anchors.
       ~
       The 's' flag has no effect because the pattern contains no dots.
`,
		},
		{
			code: String.raw`
new RegExp("123", "i");
`,
			snapshot: String.raw`
new RegExp("123", "i");
                   ~
                   The 'i' flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: String.raw`
RegExp("\\d+", "i");
`,
			snapshot: String.raw`
RegExp("\\d+", "i");
                ~
                The 'i' flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: String.raw`
/[0-9]+/i;
`,
			snapshot: String.raw`
/[0-9]+/i;
        ~
        The 'i' flag has no effect because the pattern contains no letters.
`,
		},
		{
			code: String.raw`
/\s+/m;
`,
			snapshot: String.raw`
/\s+/m;
     ~
     The 'm' flag has no effect because the pattern contains no line anchors.
`,
		},
	],
	valid: [
		String.raw`/abc/i;`,
		String.raw`/[A-Z]/i;`,
		String.raw`/[a-z0-9]/i;`,
		String.raw`/^foo/m;`,
		String.raw`/foo$/m;`,
		String.raw`/^foo$/m;`,
		String.raw`/a.b/s;`,
		String.raw`/foo/;`,
		String.raw`/foo/g;`,
		String.raw`/123/;`,
		String.raw`RegExp("abc", "i");`,
		String.raw`RegExp("^foo", "m");`,
		String.raw`RegExp("a.b", "s");`,
		String.raw`RegExp(variable, "i");`,
		String.raw`RegExp("abc", flags);`,
	],
});
