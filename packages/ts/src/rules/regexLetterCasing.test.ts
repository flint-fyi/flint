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
 Prefer lowercase characters (\`r\`) rather than uppercase (\`R\`) for consistency.
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
 Prefer lowercase characters (\`r\`) rather than uppercase (\`R\`) for consistency.
   ~
   Prefer lowercase characters (\`g\`) rather than uppercase (\`G\`) for consistency.
     ~
     Prefer lowercase characters (\`x\`) rather than uppercase (\`X\`) for consistency.
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
  Prefer lowercase character class ranges (\`a-z\`) rather than uppercase (\`A-Z\`) for consistency.
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
 Prefer lowercase unicode escapes (\`\\u000a\`) rather than uppercase (\`\\u000A\`) for consistency.
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
 Prefer lowercase unicode escapes (\`\\u{a}\`) rather than uppercase (\`\\u{A}\`) for consistency.
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
 Prefer lowercase unicode escapes (\`\\u{1f4a9}\`) rather than uppercase (\`\\u{1F4A9}\`) for consistency.
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
 Prefer lowercase hexadecimal escapes (\`\\x0a\`) rather than uppercase (\`\\x0A\`) for consistency.
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
 Prefer uppercase control escapes (\`\\cA\`) rather than lowercase (\`\\ca\`) for consistency.
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
 Prefer lowercase hexadecimal escapes (\`\\xab\`) rather than uppercase (\`\\xAB\`) for consistency.
     ~~~~
     Prefer lowercase hexadecimal escapes (\`\\xcd\`) rather than uppercase (\`\\xCD\`) for consistency.
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
  Prefer lowercase character class ranges (\`a-z\`) rather than uppercase (\`A-Z\`) for consistency.
`,
		},
	],
	valid: [
		String.raw`/(?:[A-Z]:\\|\/)[^:\s)]+:\d+(?::\d+)?/`,
		String.raw`/(?:https?:\/\/|mailto:)\S+|[\w.+-]+@[\w.-]+\.\w+/`,
		String.raw`/[\n\r]/`,
		String.raw`/[a-z]/;`,
		String.raw`/[A-z]/;`,
		String.raw`/[a-z]/g;`,
		String.raw`/[a-z]/giu;`,
		String.raw`/[a-z]/i;`,
		String.raw`/[a-z]/u;`,
		String.raw`/\cA/;`,
		String.raw`/\s$/`,
		String.raw`/\u{a}/;`,
		String.raw`/\u000a/;`,
		String.raw`/\x0a/;`,
		String.raw`/^[-?:](?:\s|$)/`,
		String.raw`/^[\s#&*!|>'"%@\`[\]{}]/`,
		String.raw`/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/`,
		String.raw`/^[+-]?\d+\.(\d+)(?:e[+-]?\d+)?$/`,
		String.raw`/^[+-]?\d+\.\d+(?:e[+-]?\d+)?$/`,
		String.raw`/^0[xobi]/`,
		String.raw`/^true|false|null|yes|no|on|off|y|n$/`,
		String.raw`/<h1[\s>]/`,
		String.raw`/regexp/;`,
		String.raw`/Regexp/;`,
		String.raw`/REGEXP/;`,
		String.raw`/utf-?8/`,
		String.raw`new RegExp('\\u000a');`,
		String.raw`new RegExp('\\x0a');`,
		String.raw`/(?:[A-Z]:\\|\/)[^:\s)]+:\d+(?::\d+)?/`,
	],
});
