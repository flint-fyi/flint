// flint-disable-file escapeSequenceCasing
import rule from "./regexControlCharacterEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/\\x00/;
`,
			output: `
/\\0/;
`,
			snapshot: `
/\\x00/;
 ~~~~
 Prefer standard escape sequence '\\0' over '\\x00'.
`,
		},
		{
			code: `
/\\x0a/;
`,
			output: `
/\\n/;
`,
			snapshot: `
/\\x0a/;
 ~~~~
 Prefer standard escape sequence '\\n' over '\\x0a'.
`,
		},
		{
			code: `
/\\x09/;
`,
			output: `
/\\t/;
`,
			snapshot: `
/\\x09/;
 ~~~~
 Prefer standard escape sequence '\\t' over '\\x09'.
`,
		},
		{
			code: `
/\\x0d/;
`,
			output: `
/\\r/;
`,
			snapshot: `
/\\x0d/;
 ~~~~
 Prefer standard escape sequence '\\r' over '\\x0d'.
`,
		},
		{
			code: `
/\\u000a/;
`,
			output: `
/\\n/;
`,
			snapshot: `
/\\u000a/;
 ~~~~~~
 Prefer standard escape sequence '\\n' over '\\u000a'.
`,
		},
		{
			code: `
/\\cJ/;
`,
			output: `
/\\n/;
`,
			snapshot: `
/\\cJ/;
 ~~~
 Prefer standard escape sequence '\\n' over '\\cJ'.
`,
		},
		{
			code: `
/\\u{a}/u;
`,
			output: `
/\\n/u;
`,
			snapshot: `
/\\u{a}/u;
 ~~~~~
 Prefer standard escape sequence '\\n' over '\\u{a}'.
`,
		},
		{
			code: `
new RegExp("\\\\x0a");
`,
			output: `
new RegExp("\\\\n");
`,
			snapshot: `
new RegExp("\\\\x0a");
            ~~~~~
            Prefer standard escape sequence '\\\\n' over '\\\\x0a'.
`,
		},
	],
	valid: [
		`/\\0\\t\\n\\v\\f\\r/;`,
		`/\\0/;`,
		`/\\t/;`,
		`/\\n/;`,
		`/\\r/;`,
		`/foo/;`,
		`/\\x1f/;`,
		`new RegExp("\\\\0\\\\t\\\\n\\\\v\\\\f\\\\r");`,
		`new RegExp("foo");`,
		`new RegExp(variable);`,
	],
});
