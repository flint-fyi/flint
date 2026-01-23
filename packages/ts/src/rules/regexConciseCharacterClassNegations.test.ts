import rule from "./regexConciseCharacterClassNegations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[^\d]/;
`,
			snapshot: String.raw`
/[^\d]/;
~~~~~~~
Use '\D' instead of negated character class.
`,
		},
		{
			code: String.raw`
/[^\D]/;
`,
			snapshot: String.raw`
/[^\D]/;
~~~~~~~
Use '\d' instead of negated character class.
`,
		},
		{
			code: String.raw`
/[^\w]/;
`,
			snapshot: String.raw`
/[^\w]/;
~~~~~~~
Use '\W' instead of negated character class.
`,
		},
		{
			code: String.raw`
/[^\W]/;
`,
			snapshot: String.raw`
/[^\W]/;
~~~~~~~
Use '\w' instead of negated character class.
`,
		},
		{
			code: String.raw`
/[^\s]/;
`,
			snapshot: String.raw`
/[^\s]/;
~~~~~~~
Use '\S' instead of negated character class.
`,
		},
		{
			code: String.raw`
/[^\S]/;
`,
			snapshot: String.raw`
/[^\S]/;
~~~~~~~
Use '\s' instead of negated character class.
`,
		},
		{
			code: String.raw`
/[^\p{ASCII}]/u;
`,
			snapshot: String.raw`
/[^\p{ASCII}]/u;
~~~~~~~~~~~~~~~
Use '\P{ASCII}' instead of negated character class.
`,
		},
		{
			code: String.raw`
/[^\P{ASCII}]/u;
`,
			snapshot: String.raw`
/[^\P{ASCII}]/u;
~~~~~~~~~~~~~~~
Use '\p{ASCII}' instead of negated character class.
`,
		},
	],
	valid: [
		String.raw`/[\d]/;`,
		String.raw`/[^\d\s]/;`,
		String.raw`/\D/;`,
		String.raw`/\W/;`,
		String.raw`/\S/;`,
		String.raw`/[abc]/;`,
		String.raw`/[^abc]/;`,
		String.raw`/[^\p{ASCII}]/iu;`,
		String.raw`/[\p{Basic_Emoji}]/v`,
		String.raw`/[^\P{Lowercase_Letter}]/iu`,
		String.raw`/[^[^a][^b]]/v`,
	],
});
