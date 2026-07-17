import rule from "./regexUnnecessaryAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/a\bb/;
`,
			snapshot: `
/a\\bb/;
  ~~
  The word boundary \`\\b\` always rejects because both sides are word characters.
`,
		},
		{
			code: String.raw`
/-\b-/;
`,
			snapshot: `
/-\\b-/;
  ~~
  The word boundary \`\\b\` always rejects because both sides are non-word characters.
`,
		},
		{
			code: String.raw`
/a\B-/;
`,
			snapshot: `
/a\\B-/;
  ~~
  The negated word boundary \`\\B\` always rejects because there is a word/non-word transition.
`,
		},
		{
			code: String.raw`
/-\Ba/;
`,
			snapshot: `
/-\\Ba/;
  ~~
  The negated word boundary \`\\B\` always rejects because there is a word/non-word transition.
`,
		},
		{
			code: `
/a^b/;
`,
			snapshot: `
/a^b/;
  ~
  The start anchor \`^\` always rejects because it is not at the start of the pattern.
`,
		},
		{
			code: `
/a$b/;
`,
			snapshot: `
/a$b/;
  ~
  The end anchor \`$\` always rejects because it is not at the end of the pattern.
`,
		},
		{
			code: String.raw`
new RegExp("a\\bb");
`,
			snapshot: `
new RegExp("a\\\\bb");
             ~~~
             The word boundary \`\\b\` always rejects because both sides are word characters.
`,
		},
		{
			code: String.raw`
new RegExp("-\\b-");
`,
			snapshot: `
new RegExp("-\\\\b-");
             ~~~
             The word boundary \`\\b\` always rejects because both sides are non-word characters.
`,
		},
		{
			code: String.raw`
new RegExp("a\\B-");
`,
			snapshot: `
new RegExp("a\\\\B-");
             ~~~
             The negated word boundary \`\\B\` always rejects because there is a word/non-word transition.
`,
		},
		{
			code: `
new RegExp("a^b");
`,
			snapshot: `
new RegExp("a^b");
             ~
             The start anchor \`^\` always rejects because it is not at the start of the pattern.
`,
		},
		{
			code: `
new RegExp("a$b");
`,
			snapshot: `
new RegExp("a$b");
             ~
             The end anchor \`$\` always rejects because it is not at the end of the pattern.
`,
		},
	],
	valid: [
		String.raw`/\bword/;`,
		String.raw`/word\b/;`,
		String.raw`/a\b-/;`,
		String.raw`/-\ba/;`,
		String.raw`/a\Ba/;`,
		String.raw`/-\B-/;`,
		`/^abc/;`,
		`/abc$/;`,
		`/a^b/m;`,
		`/a$b/m;`,
		String.raw`/[\b]/;`,
		String.raw`/a\^b/;`,
		String.raw`/a\$b/;`,
		`new RegExp(variable);`,
		String.raw`new RegExp("\\bword");`,
		String.raw`new RegExp("word\\b");`,
		`new RegExp("^abc");`,
		`new RegExp("abc$");`,
		`new RegExp("a^b", "m");`,
		`new RegExp("a$b", "m");`,
	],
});
