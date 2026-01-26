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
Use a regular expression literal when the pattern is static.
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
Use a regular expression literal when the pattern is static.
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
Use a regular expression literal when the pattern is static.
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
Use a regular expression literal when the pattern is static.
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
Use a regular expression literal when the pattern is static.
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
Use a regular expression literal when the pattern is static.
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
Use a regular expression literal when the pattern is static.
`,
		},
		{
			code: String.raw`
RegExp("line1\nline2");
`,
			output: String.raw`
/line1\nline2/;
`,
			snapshot: String.raw`
RegExp("line1\nline2");
~~~~~~
Use a regular expression literal when the pattern is static.
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
