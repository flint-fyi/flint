// spellchecker:disable
import rule from "./regexUnnecessaryNonCapturingGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?:abcd)/;
`,
			output: `
/abcd/;
`,
			snapshot: `
/(?:abcd)/;
 ~~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:abcd)/v;
`,
			output: `
/abcd/v;
`,
			snapshot: `
/(?:abcd)/v;
 ~~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/foo(?:bar)baz/;
`,
			output: `
/foobarbaz/;
`,
			snapshot: `
/foo(?:bar)baz/;
    ~~~~~~~
    This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:[abc])/;
`,
			output: `
/[abc]/;
`,
			snapshot: `
/(?:[abc])/;
 ~~~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:a)/;
`,
			output: `
/a/;
`,
			snapshot: `
/(?:a)/;
 ~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:a)+/;
`,
			output: `
/a+/;
`,
			snapshot: `
/(?:a)+/;
 ~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: String.raw`
/(?:\w)*/;
`,
			output: String.raw`
/\w*/;
`,
			snapshot: String.raw`
/(?:\w)*/;
 ~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
new RegExp("(?:a)+");
`,
			output: `
new RegExp("a+");
`,
			snapshot: `
new RegExp("(?:a)+");
            ~~~~~
            This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:a|b)/;
`,
			output: `
/a|b/;
`,
			snapshot: `
/(?:a|b)/;
 ~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:a|b|c)/;
`,
			output: `
/a|b|c/;
`,
			snapshot: `
/(?:a|b|c)/;
 ~~~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:.)/;
`,
			output: `
/./;
`,
			snapshot: `
/(?:.)/;
 ~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/a(?:b)/;
`,
			output: `
/ab/;
`,
			snapshot: `
/a(?:b)/;
  ~~~~~
  This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:ab|cd)/;
`,
			output: `
/ab|cd/;
`,
			snapshot: `
/(?:ab|cd)/;
 ~~~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/a(?:ab|(?:.|a|b))/;
`,
			output: `
/a(?:ab|.|a|b)/;
`,
			snapshot: `
/a(?:ab|(?:.|a|b))/;
        ~~~~~~~~~
        This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/(?:[abcd]+?)/;
`,
			output: `
/[abcd]+?/;
`,
			snapshot: `
/(?:[abcd]+?)/;
 ~~~~~~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: String.raw`
/(?:a\n)/;
`,
			output: String.raw`
/a\n/;
`,
			snapshot: String.raw`
/(?:a\n)/;
 ~~~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/foo(?:[abc]*)bar/;
`,
			output: `
/foo[abc]*bar/;
`,
			snapshot: `
/foo(?:[abc]*)bar/;
    ~~~~~~~~~~
    This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: `
/a|(?:b|c)/;
`,
			output: `
/a|b|c/;
`,
			snapshot: `
/a|(?:b|c)/;
   ~~~~~~~
   This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: String.raw`
/(?:0)/;
`,
			output: String.raw`
/0/;
`,
			snapshot: String.raw`
/(?:0)/;
 ~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
		{
			code: String.raw`
/(?:1)/;
`,
			output: String.raw`
/1/;
`,
			snapshot: String.raw`
/(?:1)/;
 ~~~~~
 This non-capturing group can be removed without changing the regular expression's behavior.
`,
		},
	],
	valid: [
		`/(?:(?!a))+/;`,
		`/(?:(?=a))+/;`,
		`/(?:)/;`,
		`/(?:a{2})+/;`,
		`/(?:a|b)+/;`,
		`/(?:a|b)c/;`,
		`/(?:a|bc)d/;`,
		`/(?:ab)?/;`,
		`/(?:ab)+/;`,
		`/(?:ab|cd)?/;`,
		`/{(?:2,)}/;`,
		`/{(?:2,5)}/;`,
		`/{(?:2)}/;`,
		`/{2,(?:5)}/;`,
		`/a(?:{2})/;`,
		`/a(?:b|c)d/;`,
		`/a{(?:5})/;`,
		`/x(?:a|b)y/;`,
		`RegExp(variable);`,
		String.raw`/(?:\x4)1/;`,
		String.raw`/(.)\1(?:2\s)/;`,
		String.raw`/()\1(?:0)/;`,
		String.raw`/(\d)(?=(?:\d{3})+(?!\d))/g;`,
		String.raw`/\0(?:1)/;`,
		String.raw`/\0(?:2)/;`,
		String.raw`/\1(?:0)/;`,
		String.raw`/\1(?:2)/;`,
		String.raw`/\c(?:A)/;`,
		String.raw`/\c(?:A)/;`,
		String.raw`/\u(?:0)041/;`,
		String.raw`/\u{(?:41)}/;`,
		String.raw`/\u0(?:0)41/;`,
		String.raw`/\u00(?:4)1/;`,
		String.raw`/\u004(?:1)/;`,
		String.raw`/\x(?:4)1/;`,
		String.raw`/\x(?:41\w+)/;`,
		String.raw`/\x4(?:1)*/;`,
		String.raw`/\x4(?:1)/;`,
	],
});
