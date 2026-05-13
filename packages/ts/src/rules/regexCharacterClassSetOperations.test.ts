import rule from "./regexCharacterClassSetOperations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/(?!a)\w/v;
`,
			snapshot: String.raw`
/(?!a)\w/v;
~~~~~~~~~~
This lookaround can be combined with '\w' using a set operation.
`,
		},
		{
			code: String.raw`
/(?!\d)\w/v;
`,
			snapshot: String.raw`
/(?!\d)\w/v;
~~~~~~~~~~~
This lookaround can be combined with '\w' using a set operation.
`,
		},
		{
			code: String.raw`
/\w(?<=\d)/v;
`,
			snapshot: String.raw`
/\w(?<=\d)/v;
~~~~~~~~~~~~
This lookaround can be combined with '\w' using a set operation.
`,
		},
		{
			code: String.raw`
/(?=\d)\w/v;
`,
			snapshot: String.raw`
/(?=\d)\w/v;
~~~~~~~~~~~
This lookaround can be combined with '\w' using a set operation.
`,
		},
		{
			code: String.raw`
/\w(?<!\d)/v;
`,
			snapshot: String.raw`
/\w(?<!\d)/v;
~~~~~~~~~~~~
This lookaround can be combined with '\w' using a set operation.
`,
		},
	],
	valid: [
		String.raw`/a\b/;`,
		String.raw`/a\b/u;`,
		String.raw`/a\b/v;`,
		String.raw`/(?!a)\w/;`,
		String.raw`/(?!a)\w/u;`,
		String.raw`/[\w--\d]/v;`,
		String.raw`/[\w&&\d]/v;`,
		String.raw`/(?!abc)\w/v;`,
		String.raw`/(?!\d)/v;`,
	],
});
