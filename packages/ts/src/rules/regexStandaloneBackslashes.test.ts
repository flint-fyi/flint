import rule from "./regexStandaloneBackslashes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\c/;
`,
			snapshot: `
/\\c/;
 ~
 Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
		{
			code: String.raw`
/\c-/;
`,
			snapshot: `
/\\c-/;
 ~
 Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
		{
			code: String.raw`
/\c1/;
`,
			snapshot: `
/\\c1/;
 ~
 Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
		{
			code: String.raw`
/[\c]/;
`,
			snapshot: `
/[\\c]/;
  ~
  Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
		{
			code: String.raw`
/a\c-b/;
`,
			snapshot: `
/a\\c-b/;
  ~
  Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
		{
			code: String.raw`
/\c\c/;
`,
			snapshot: `
/\\c\\c/;
 ~
 Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
   ~
   Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
		{
			code: `
new RegExp("\\\\c");
`,
			snapshot: `
new RegExp("\\\\c");
            ~
            Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
		{
			code: `
RegExp("\\\\c1");
`,
			snapshot: `
RegExp("\\\\c1");
        ~
        Standalone backslash (\`\\\`) looks like an incomplete escape sequence.
`,
		},
	],
	valid: [
		String.raw`/\cX/;`,
		String.raw`/\cA/;`,
		String.raw`/\cZ/;`,
		String.raw`/\cB/;`,
		String.raw`/\n/;`,
		String.raw`/\t/;`,
		String.raw`/\r/;`,
		String.raw`/\d/;`,
		String.raw`/\w/;`,
		String.raw`/\s/;`,
		String.raw`/\x00/;`,
		String.raw`/\u0000/;`,
		String.raw`/\\/;`,
		String.raw`/[[\cA-\cZ]--\cX]/v;`,
		`new RegExp("\\\\n");`,
		`new RegExp("\\\\t");`,
		`new RegExp("\\\\cX");`,
		`new RegExp(variable);`,
		`/abc/;`,
		`/[abc]/;`,
		`notRegExp("\\\\c");`,
		`new NotRegExp("\\\\c");`,
	],
});
