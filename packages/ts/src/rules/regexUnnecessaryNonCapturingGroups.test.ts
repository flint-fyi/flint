import rule from "./regexUnnecessaryNonCapturingGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?:abcd)/;
`,
			snapshot: `
/(?:abcd)/;
 ~~~~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/foo(?:bar)baz/;
`,
			snapshot: `
/foo(?:bar)baz/;
    ~~~~~~~
    Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/(?:[abc])/;
`,
			snapshot: `
/(?:[abc])/;
 ~~~~~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/(?:a)/;
`,
			snapshot: `
/(?:a)/;
 ~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/(?:a)+/;
`,
			snapshot: `
/(?:a)+/;
 ~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: String.raw`
/(?:\w)*/;
`,
			snapshot: String.raw`
/(?:\w)*/;
 ~~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
new RegExp("(?:a)+");
`,
			snapshot: `
new RegExp("(?:a)+");
            ~~~~~
            Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/(?:a|b)/;
`,
			snapshot: `
/(?:a|b)/;
 ~~~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/(?:a|b|c)/;
`,
			snapshot: `
/(?:a|b|c)/;
 ~~~~~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/(?:.)/;
`,
			snapshot: `
/(?:.)/;
 ~~~~~
 Remove unnecessary non-capturing group.
`,
		},
		{
			code: `
/a(?:b)/;
`,
			snapshot: `
/a(?:b)/;
  ~~~~~
  Remove unnecessary non-capturing group.
`,
		},
	],
	valid: [
		`/a(?:b|c)d/;`,
		`/(?:a|b)+/;`,
		`/(?:ab)?/;`,
		`/(?:ab)+/;`,
		`/(?:a{2})+/;`,
		String.raw`/\x4(?:1)/;`,
		String.raw`/\c(?:A)/;`,
		String.raw`/\1(?:2)/;`,
		`/a(?:{2})/;`,
		`/(?:(?=a))+/;`,
		`RegExp(variable);`,
		`/(?:a|bc)d/;`,
		`/x(?:a|b)y/;`,
		`/(?:ab|cd)?/;`,
		`/(?:(?!a))+/;`,
	],
});
