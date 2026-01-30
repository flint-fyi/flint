import rule from "./regexUnnecessaryAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a\\bb/;
`,
			snapshot: `
/a\\bb/;
  ~~
  The word boundary \`\\b\` always rejects because both sides are word characters.
`,
		},
		{
			code: `
/-\\b-/;
`,
			snapshot: `
/-\\b-/;
  ~~
  The word boundary \`\\b\` always rejects because both sides are non-word characters.
`,
		},
		{
			code: `
/a\\B-/;
`,
			snapshot: `
/a\\B-/;
  ~~
  The negated word boundary \`\\B\` always rejects because there is a word/non-word transition.
`,
		},
		{
			code: `
/-\\Ba/;
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
			code: `
new RegExp("a\\\\bb");
`,
			snapshot: `
new RegExp("a\\\\bb");
             ~~~
             The word boundary \`\\b\` always rejects because both sides are word characters.
`,
		},
		{
			code: `
new RegExp("-\\\\b-");
`,
			snapshot: `
new RegExp("-\\\\b-");
             ~~~
             The word boundary \`\\b\` always rejects because both sides are non-word characters.
`,
		},
		{
			code: `
new RegExp("a\\\\B-");
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
		`/\\bword/;`,
		`/word\\b/;`,
		`/a\\b-/;`,
		`/-\\ba/;`,
		`/a\\Ba/;`,
		`/-\\B-/;`,
		`/^abc/;`,
		`/abc$/;`,
		`/a^b/m;`,
		`/a$b/m;`,
		`/[\\b]/;`,
		`/a\\^b/;`,
		`/a\\$b/;`,
		`new RegExp(variable);`,
		`new RegExp("\\\\bword");`,
		`new RegExp("word\\\\b");`,
		`new RegExp("^abc");`,
		`new RegExp("abc$");`,
		`new RegExp("a^b", "m");`,
		`new RegExp("a$b", "m");`,
	],
});
