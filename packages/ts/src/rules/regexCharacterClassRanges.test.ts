import rule from "./regexCharacterClassRanges.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[abcd]/;
`,
			output: `
/[a-d]/;
`,
			snapshot: `
/[abcd]/;
~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-d'.
`,
		},
		{
			code: `
/[0123]/;
`,
			output: `
/[0-3]/;
`,
			snapshot: `
/[0123]/;
~~~~~~~~
Multiple adjacent characters can be simplified to a range '0-3'.
`,
		},
		{
			code: `
/[ABCD]/;
`,
			output: `
/[A-D]/;
`,
			snapshot: `
/[ABCD]/;
~~~~~~~~
Multiple adjacent characters can be simplified to a range 'A-D'.
`,
		},
		{
			code: `
/[abcde]/;
`,
			output: `
/[a-e]/;
`,
			snapshot: `
/[abcde]/;
~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-e'.
`,
		},
		{
			code: `
/[01234]/;
`,
			output: `
/[0-4]/;
`,
			snapshot: `
/[01234]/;
~~~~~~~~~
Multiple adjacent characters can be simplified to a range '0-4'.
`,
		},
		{
			code: `
/[a-cd]/;
`,
			output: `
/[a-d]/;
`,
			snapshot: `
/[a-cd]/;
~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-d'.
`,
		},
		{
			code: `
/[abcd0123]/;
`,
			output: `
/[a-d0123]/;
`,
			snapshot: `
/[abcd0123]/;
~~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-d'.
`,
		},
		{
			code: `
/[ABCD abcd]/;
`,
			output: `
/[A-D abcd]/;
`,
			snapshot: `
/[ABCD abcd]/;
~~~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'A-D'.
`,
		},
		{
			code: `
/[ABCD abcd]/v;
`,
			output: `
/[A-D abcd]/v;
`,
			snapshot: `
/[ABCD abcd]/v;
~~~~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'A-D'.
`,
		},
		{
			code: `
/[abc-f]/;
`,
			output: `
/[a-f]/;
`,
			snapshot: `
/[abc-f]/;
~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-f'.
`,
		},
		{
			code: `
/[a-cd-f]/;
`,
			output: `
/[a-f]/;
`,
			snapshot: `
/[a-cd-f]/;
~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-f'.
`,
		},
		{
			code: `
/[d-fa-c]/;
`,
			output: `
/[a-f]/;
`,
			snapshot: `
/[d-fa-c]/;
~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-f'.
`,
		},
		{
			code: `
/[abc_d-f]/;
`,
			output: `
/[a-f_]/;
`,
			snapshot: `
/[abc_d-f]/;
~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-f'.
`,
		},
		{
			code: `
/[abc_d-f_h-j_k-m]/;
`,
			output: `
/[a-f__h-j_k-m]/;
`,
			snapshot: `
/[abc_d-f_h-j_k-m]/;
~~~~~~~~~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-f'.
`,
		},
		{
			code: `
/[a-d_d-f_h-k_j-m]/;
`,
			output: `
/[a-f__h-k_j-m]/;
`,
			snapshot: `
/[a-d_d-f_h-k_j-m]/;
~~~~~~~~~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-f'.
`,
		},
		{
			code: `
/[3-4560-2]/;
`,
			output: `
/[0-6]/;
`,
			snapshot: `
/[3-4560-2]/;
~~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range '0-6'.
`,
		},
	],
	valid: [
		`/[a]/;`,
		`/[ab]/;`,
		`/[abc]/;`,
		`/[a-d]/;`,
		`/[0-9]/;`,
		`/[A-Z]/;`,
		`/[a-zA-Z]/;`,
		`/[a-z0-9]/;`,
		`/[ !"#$]/;`,
		`/[ace]/;`,
		`/[aeiou]/;`,
		`/[a-zA-ZZ-a]/;`,
		`/[ -$]/;`,
		String.raw`/[\q{a|b|c|d|e|f|abcdef}]/v;`,
	],
});
