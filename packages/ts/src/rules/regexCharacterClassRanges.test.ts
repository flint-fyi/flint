import rule from "./regexCharacterClassRanges.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[abcd]/;
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
			snapshot: `
/[abcd0123]/;
~~~~~~~~~~~~
Multiple adjacent characters can be simplified to a range 'a-d'.
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
	],
});
