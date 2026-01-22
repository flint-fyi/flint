import rule from "./regexCharacterClasses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a|b|c/;
`,
			snapshot: `
/a|b|c/;
~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: `
/a|b|c|d/;
`,
			snapshot: `
/a|b|c|d/;
~~~~~~~~~
This alternation can be simplified to a character class '[abcd]'.
`,
		},
		{
			code: `
/(a|b|c)/;
`,
			snapshot: `
/(a|b|c)/;
~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: `
/(?:a|b|c)/;
`,
			snapshot: `
/(?:a|b|c)/;
~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: `
/a|b|[cd]/;
`,
			snapshot: `
/a|b|[cd]/;
~~~~~~~~~~
This alternation can be simplified to a character class '[abcd]'.
`,
		},
		{
			code: `
/a|b|c|\\d/;
`,
			snapshot: `
/a|b|c|\\d/;
~~~~~~~~~~
This alternation can be simplified to a character class '[abc\\d]'.
`,
		},
		{
			code: `
/x|y|z/g;
`,
			snapshot: `
/x|y|z/g;
~~~~~~~~
This alternation can be simplified to a character class '[xyz]'.
`,
		},
		{
			code: `
/1|2|3|4|5/;
`,
			snapshot: `
/1|2|3|4|5/;
~~~~~~~~~~~
This alternation can be simplified to a character class '[12345]'.
`,
		},
		{
			code: `
/\\w|\\d|a/;
`,
			snapshot: `
/\\w|\\d|a/;
~~~~~~~~~
This alternation can be simplified to a character class '[\\w\\da]'.
`,
		},
		{
			code: `
/[a-z]|[0-9]/;
`,
			snapshot: `
/[a-z]|[0-9]/;
~~~~~~~~~~~~~
This alternation can be simplified to a character class '[a-z0-9]'.
`,
		},
	],
	valid: [
		`/a|b/;`,
		`/a|bc/;`,
		`/ab|cd/;`,
		`/a|b|c\\b/;`,
		`/a|b.c/;`,
		`/[abc]/;`,
		`/a?|b/;`,
		`/(a)+|b/;`,
		`/a{2}|b/;`,
		`/\\d+|\\w/;`,
	],
});
