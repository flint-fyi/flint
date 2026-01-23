// flint-disable-file escapeSequenceCasing
import rule from "./regexLetterCasing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/Regexp/i;
`,
			output: String.raw`
/regexp/i;
`,
			snapshot: `
/Regexp/i;
 ~
 'R' is not in lowercase.
`,
		},
		{
			code: String.raw`
/ReGeXp/i;
`,
			output: String.raw`
/regexp/i;
`,
			snapshot: `
/ReGeXp/i;
 ~
 'R' is not in lowercase.
   ~
   'G' is not in lowercase.
     ~
     'X' is not in lowercase.
`,
		},
		{
			code: String.raw`
/[A-Z]/i;
`,
			output: String.raw`
/[a-z]/i;
`,
			snapshot: `
/[A-Z]/i;
  ~~~
  'A-Z' is not in lowercase.
`,
		},
		{
			code: String.raw`
/\u000A/;
`,
			output: String.raw`
/\u000a/;
`,
			snapshot: `
/\\u000A/;
 ~~~~~~
 '\\u000A' is not in lowercase.
`,
		},
		{
			code: String.raw`
/\u{A}/u;
`,
			output: String.raw`
/\u{a}/u;
`,
			snapshot: `
/\\u{A}/u;
 ~~~~~
 '\\u{A}' is not in lowercase.
`,
		},
		{
			code: String.raw`
/\u{1F4A9}/u;
`,
			output: String.raw`
/\u{1f4a9}/u;
`,
			snapshot: `
/\\u{1F4A9}/u;
 ~~~~~~~~~
 '\\u{1F4A9}' is not in lowercase.
`,
		},
		{
			code: String.raw`
/\x0A/;
`,
			output: String.raw`
/\x0a/;
`,
			snapshot: `
/\\x0A/;
 ~~~~
 '\\x0A' is not in lowercase.
`,
		},
		{
			code: String.raw`
/\ca/u;
`,
			output: String.raw`
/\cA/u;
`,
			snapshot: `
/\\ca/u;
 ~~~
 '\\ca' is not in uppercase.
`,
		},
		{
			code: String.raw`
/\xAB\xCD/;
`,
			output: String.raw`
/\xab\xcd/;
`,
			snapshot: `
/\\xAB\\xCD/;
 ~~~~
 '\\xAB' is not in lowercase.
     ~~~~
     '\\xCD' is not in lowercase.
`,
		},

		{
			code: String.raw`
/[A-Z]/i;
`,
			output: String.raw`
/[a-z]/i;
`,
			snapshot: `
/[A-Z]/i;
  ~~~
  'A-Z' is not in lowercase.
`,
		},
	],
	valid: [
		String.raw`/regexp/i;`,
		String.raw`/REGEXP/;`,
		String.raw`/Regexp/;`,
		String.raw`/[A-z]/i;`,
		String.raw`/\u000a/;`,
		String.raw`/\u{a}/u;`,
		String.raw`/\x0a/;`,
		String.raw`/\cA/u;`,
		String.raw`new RegExp('\\u000a');`,
		String.raw`new RegExp('\\x0a');`,
		String.raw`/[a-z]/i;`,
	],
});
