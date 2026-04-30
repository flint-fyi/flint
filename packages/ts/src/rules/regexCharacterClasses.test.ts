import rule from "./regexCharacterClasses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a|b|c/;
`,
			output: `
/[abc]/;
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
			output: `
/[abcd]/;
`,
			snapshot: `
/a|b|c|d/;
~~~~~~~~~
This alternation can be simplified to a character class '[abcd]'.
`,
		},
		{
			code: String.raw`
/a|b|c|\d/;
`,
			output: String.raw`
/[abc\d]/;
`,
			snapshot: String.raw`
/a|b|c|\d/;
~~~~~~~~~~
This alternation can be simplified to a character class '[abc\d]'.
`,
		},
		{
			code: `
/(a|b|c)/;
`,
			output: `
/([abc])/;
`,
			snapshot: `
/(a|b|c)/;
~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: String.raw`
/(a|b|c|\d)/;
`,
			output: String.raw`
/([abc\d])/;
`,
			snapshot: String.raw`
/(a|b|c|\d)/;
~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc\d]'.
`,
		},
		{
			code: `
/(?:a|b|c)/;
`,
			output: `
/(?:[abc])/;
`,
			snapshot: `
/(?:a|b|c)/;
~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: String.raw`
/(?:a|b|c|\d)/;
`,
			output: String.raw`
/(?:[abc\d])/;
`,
			snapshot: String.raw`
/(?:a|b|c|\d)/;
~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc\d]'.
`,
		},
		{
			code: `
/(?=a|b|c)/;
`,
			output: `
/(?=[abc])/;
`,
			snapshot: `
/(?=a|b|c)/;
~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: String.raw`
/(?=a|b|c|\d)/;
`,
			output: String.raw`
/(?=[abc\d])/;
`,
			snapshot: String.raw`
/(?=a|b|c|\d)/;
~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc\d]'.
`,
		},
		{
			code: `
/(?!a|b|c)/;
`,
			output: `
/(?![abc])/;
`,
			snapshot: `
/(?!a|b|c)/;
~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: `
/(?<=a|b|c)/;
`,
			output: `
/(?<=[abc])/;
`,
			snapshot: `
/(?<=a|b|c)/;
~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: String.raw`
/(?<=a|b|c|\d)/;
`,
			output: String.raw`
/(?<=[abc\d])/;
`,
			snapshot: String.raw`
/(?<=a|b|c|\d)/;
~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc\d]'.
`,
		},
		{
			code: `
/(?<!a|b|c)/;
`,
			output: `
/(?<![abc])/;
`,
			snapshot: `
/(?<!a|b|c)/;
~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: `
/a|b|[cd]/;
`,
			output: `
/[abcd]/;
`,
			snapshot: `
/a|b|[cd]/;
~~~~~~~~~~
This alternation can be simplified to a character class '[abcd]'.
`,
		},
		{
			code: String.raw`
/a|b|c|\d|[d-f]/;
`,
			output: String.raw`
/[abc\dd-f]/;
`,
			snapshot: String.raw`
/a|b|c|\d|[d-f]/;
~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc\dd-f]'.
`,
		},
		{
			code: `
/[a-z]|[0-9]/;
`,
			output: `
/[a-z0-9]/;
`,
			snapshot: `
/[a-z]|[0-9]/;
~~~~~~~~~~~~~
This alternation can be simplified to a character class '[a-z0-9]'.
`,
		},
		{
			code: String.raw`
/a|-|c|\d|c|[-d-f]/;
`,
			output: String.raw`
/[a\-c\dc\-d-f]/;
`,
			snapshot: String.raw`
/a|-|c|\d|c|[-d-f]/;
~~~~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[a\-c\dc\-d-f]'.
`,
		},
		{
			code: String.raw`
/a|[.]|c|\d|c|[-d-f]/;
`,
			output: String.raw`
/[a.c\dc\-d-f]/;
`,
			snapshot: String.raw`
/a|[.]|c|\d|c|[-d-f]/;
~~~~~~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[a.c\dc\-d-f]'.
`,
		},
		{
			code: String.raw`
/]|a|b/;
`,
			output: String.raw`
/[\]ab]/;
`,
			snapshot: String.raw`
/]|a|b/;
~~~~~~~
This alternation can be simplified to a character class '[\]ab]'.
`,
		},
		{
			code: String.raw`
/-|a|c/;
`,
			output: String.raw`
/[\-ac]/;
`,
			snapshot: String.raw`
/-|a|c/;
~~~~~~~
This alternation can be simplified to a character class '[\-ac]'.
`,
		},
		{
			code: String.raw`
/a|-|c/;
`,
			output: String.raw`
/[a\-c]/;
`,
			snapshot: String.raw`
/a|-|c/;
~~~~~~~
This alternation can be simplified to a character class '[a\-c]'.
`,
		},
		{
			code: String.raw`
/a|[-]|c/;
`,
			output: String.raw`
/[a\-c]/;
`,
			snapshot: String.raw`
/a|[-]|c/;
~~~~~~~~~
This alternation can be simplified to a character class '[a\-c]'.
`,
		},
		{
			code: String.raw`
/(?<foo>a|b|c)/;
`,
			output: String.raw`
/(?<foo>[abc])/;
`,
			snapshot: String.raw`
/(?<foo>a|b|c)/;
~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]'.
`,
		},
		{
			code: String.raw`
/(?:a|b|c|d\b)/;
`,
			output: String.raw`
/(?:[abc]|d\b)/;
`,
			snapshot: String.raw`
/(?:a|b|c|d\b)/;
~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[abc]|d\b'.
`,
		},
		{
			code: String.raw`
/(?:a|b\b|[c]|d)/;
`,
			output: String.raw`
/(?:a|b\b|[cd])/;
`,
			snapshot: String.raw`
/(?:a|b\b|[c]|d)/;
~~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class 'a|b\b|[cd]'.
`,
		},
		{
			code: String.raw`
/(?:\w|-|\+|\\*|\/)+/;
`,
			output: String.raw`
/(?:[\w\-\+]|\\*|\/)+/;
`,
			snapshot: String.raw`
/(?:\w|-|\+|\\*|\/)+/;
~~~~~~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[\w\-\+]|\\*|\/'.
`,
		},
		{
			code: String.raw`
/(?:a|\w|\s|["'])/;
`,
			output: String.raw`
/(?:[a\w\s"'])/;
`,
			snapshot: String.raw`
/(?:a|\w|\s|["'])/;
~~~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[a\w\s"']'.
`,
		},
		{
			code: `
/x|y|z/g;
`,
			output: `
/[xyz]/g;
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
			output: `
/[12345]/;
`,
			snapshot: `
/1|2|3|4|5/;
~~~~~~~~~~~
This alternation can be simplified to a character class '[12345]'.
`,
		},
		{
			code: String.raw`
/\w|\d|a/;
`,
			output: String.raw`
/[\w\da]/;
`,
			snapshot: String.raw`
/\w|\d|a/;
~~~~~~~~~
This alternation can be simplified to a character class '[\w\da]'.
`,
		},
		{
			code: String.raw`
/1|2|3|[\w--\d]/v;
`,
			output: String.raw`
/[123[\w--\d]]/v;
`,
			snapshot: String.raw`
/1|2|3|[\w--\d]/v;
~~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[123[\w--\d]]'.
`,
		},
		{
			code: String.raw`
/1|&|&|[\w--\d]/v;
`,
			output: String.raw`
/[1\&&[\w--\d]]/v;
`,
			snapshot: String.raw`
/1|&|&|[\w--\d]/v;
~~~~~~~~~~~~~~~~~
This alternation can be simplified to a character class '[1\&&[\w--\d]]'.
`,
		},
		{
			code: String.raw`
/a|[^b]|c/v;
`,
			output: String.raw`
/[a[^b]c]/v;
`,
			snapshot: String.raw`
/a|[^b]|c/v;
~~~~~~~~~~~
This alternation can be simplified to a character class '[a[^b]c]'.
`,
		},
	],
	valid: [
		`/(?:a|b)/;`,
		`/a|b/;`,
		`/a|bc/;`,
		`/ab|cd/;`,
		`/reg|exp/;`,
		String.raw`/(?:a|b|c\b)/;`,
		String.raw`/(?:[ab]|c\b)/;`,
		String.raw`/(?:[ab]|cd)/;`,
		String.raw`/(?:[ab]|(c))/;`,
		`/[abc]/;`,
		`/[regexp]/;`,
		`/a?|b/;`,
		`/(a)+|b/;`,
		`/a{2}|b/;`,
		String.raw`/\d+|\w/;`,
		`/a|b.c/;`,
		`/regexp/;`,
		String.raw`/a|[^b]|c/;`,
	],
});
