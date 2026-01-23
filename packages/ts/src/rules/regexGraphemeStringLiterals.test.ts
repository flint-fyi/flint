import rule from "./regexGraphemeStringLiterals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\q{abc}]/v;
`,
			snapshot: String.raw`
/[\q{abc}]/v;
~~~~~~~~~~~~
Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '(?:abc|[...])') for strings instead.
`,
		},
		{
			code: String.raw`
/[\q{a|bc|}]/v;
`,
			snapshot: String.raw`
/[\q{a|bc|}]/v;
~~~~~~~~~~~~~~
Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '(?:bc|[...])') for strings instead.
`,
		},
		{
			code: String.raw`
/[\q{abc|def|ghi|j|k|lm|n}]/v;
`,
			snapshot: String.raw`
/[\q{abc|def|ghi|j|k|lm|n}]/v;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '(?:abc|def|ghi|lm|[...])') for strings instead.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '(?:abc|def|ghi|lm|[...])') for strings instead.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '(?:abc|def|ghi|lm|[...])') for strings instead.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '(?:abc|def|ghi|lm|[...])') for strings instead.
`,
		},
		{
			code: String.raw`
/[\q{🇦🇨🇦🇩}]/v;
`,
			snapshot: String.raw`
/[\q{🇦🇨🇦🇩}]/v;
~~~~~~~~~~~~~~~~~
Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '(?:🇦🇨🇦🇩|[...])') for strings instead.
`,
		},
	],
	valid: [
		String.raw`/[\q{a}]/v;`,
		String.raw`/[\q{a|b|c}]/v;`,
		String.raw`/[\q{a|b|c|}]/v;`,
		String.raw`/[\q{©️}]/v;`,
		String.raw`/[\q{🇦🇨}]/v;`,
		String.raw`/[\q{👨‍👩‍👧‍👦}]/v;`,
		String.raw`/[abc]/;`,
		String.raw`/a|b|c/;`,
		String.raw`/abc/u;`,
	],
});
