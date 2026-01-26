import rule from "./regexLiterals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
RegExp("abc");
`,
			output: `
/abc/;
`,
			snapshot: `
RegExp("abc");
~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
		{
			code: `
new RegExp("abc");
`,
			output: `
/abc/;
`,
			snapshot: `
new RegExp("abc");
~~~~~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
		{
			code: `
new RegExp(\`abc\`);
`,
			output: `
/abc/;
`,
			snapshot: `
new RegExp(\`abc\`);
~~~~~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
		{
			code: `
RegExp("abc", "gi");
`,
			output: `
/abc/gi;
`,
			snapshot: `
RegExp("abc", "gi");
~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
		{
			code: `
RegExp("a/b");
`,
			output: `
/a\\/b/;
`,
			snapshot: `
RegExp("a/b");
~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
		{
			code: `
RegExp("");
`,
			output: `
/(?:)/;
`,
			snapshot: `
RegExp("");
~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
		{
			code: `
new RegExp("test\\\\d+");
`,
			output: `
/test\\d+/;
`,
			snapshot: `
new RegExp("test\\\\d+");
~~~~~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
		{
			code: String.raw`
RegExp("line1\nline2");
`,
			output: String.raw`
/line1\nline2/;
`,
			snapshot: `
RegExp("line1\\nline2");
~~~~~~
This \`RegExp\` construction with a static value can be simplified to a regular expression literal.
`,
		},
	],
	valid: [
		"RegExp(pattern);",
		"new RegExp(pattern);",
		"RegExp(`a${b}`);",
		"new RegExp(`a${b}`);",
		"RegExp('abc', flags);",
		"new RegExp('abc', flags);",
		"function test(RegExp: typeof globalThis.RegExp) { return RegExp('abc'); }",
		"/abc/;",
	],
});
