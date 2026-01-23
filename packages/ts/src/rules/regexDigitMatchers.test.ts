import rule from "./regexDigitMatchers.ts";
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
  ~~~~
  These multiple adjacent characters can be simplified to \`a-d\` instead.
`,
		},
		{
			code: `
/[ABCD abcd]/;
`,
			output: `
/[A-D a-d]/;
`,
			snapshot: `
/[ABCD abcd]/;
  ~~~~
  These multiple adjacent characters can be simplified to \`A-D\` instead.
       ~~~~
       These multiple adjacent characters can be simplified to \`a-d\` instead.
`,
		},
		{
			code: `
/[ABCD abcd]/v;
`,
			output: `
/[A-D a-d]/v;
`,
			snapshot: `
/[ABCD abcd]/v;
  ~~~~
  These multiple adjacent characters can be simplified to \`A-D\` instead.
       ~~~~
       These multiple adjacent characters can be simplified to \`a-d\` instead.
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
  ~~~~~
  These multiple adjacent characters can be simplified to \`a-f\` instead.
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
  ~~~~~~
  These multiple adjacent characters can be simplified to \`a-f\` instead.
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
  ~~~~~~
  These multiple adjacent characters can be simplified to \`a-f\` instead.
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
  ~~~
  These multiple adjacent characters can be simplified to \`a-f\` instead.
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
  ~~~~~~~~
  These multiple adjacent characters can be simplified to \`0-6\` instead.
`,
		},
		{
			code: `
/[0123456789]/;
`,
			output: `
/[0-9]/;
`,
			snapshot: `
/[0123456789]/;
  ~~~~~~~~~~
  These multiple adjacent characters can be simplified to \`0-9\` instead.
`,
		},
		{
			code: `
/[^0123456789]/;
`,
			output: `
/[^0-9]/;
`,
			snapshot: `
/[^0123456789]/;
   ~~~~~~~~~~
   These multiple adjacent characters can be simplified to \`0-9\` instead.
`,
		},
		{
			code: `
/^[0123456789]+$/;
`,
			output: `
/^[0-9]+$/;
`,
			snapshot: `
/^[0123456789]+$/;
   ~~~~~~~~~~
   These multiple adjacent characters can be simplified to \`0-9\` instead.
`,
		},
		{
			code: `
new RegExp("[abcd]");
`,
			output: `
new RegExp("[a-d]");
`,
			snapshot: `
new RegExp("[abcd]");
             ~~~~
             These multiple adjacent characters can be simplified to \`a-d\` instead.
`,
		},
		{
			code: `
new RegExp("[0123456789]");
`,
			output: `
new RegExp("[0-9]");
`,
			snapshot: `
new RegExp("[0123456789]");
             ~~~~~~~~~~
             These multiple adjacent characters can be simplified to \`0-9\` instead.
`,
		},
		{
			code: `
RegExp("[ABCDEFG]");
`,
			output: `
RegExp("[A-G]");
`,
			snapshot: `
RegExp("[ABCDEFG]");
         ~~~~~~~
         These multiple adjacent characters can be simplified to \`A-G\` instead.
`,
		},
		{
			code: `
/[abc_d-f_h-j_k-m]/;
`,
			output: `
/[a-f__h-m_]/;
`,
			snapshot: `
/[abc_d-f_h-j_k-m]/;
  ~~~
  These multiple adjacent characters can be simplified to \`a-f\` instead.
          ~~~
          These multiple adjacent characters can be simplified to \`h-m\` instead.
`,
		},
	],
	valid: [
		`/[a]/;`,
		`/[ab]/;`,
		`/[abc]/;`,
		`/[a-b]/;`,
		`/[a-c]/;`,
		`/[a-d]/;`,
		`/[0-9]/;`,
		`/[A-Z]/;`,
		`/[a-zA-ZZ-a]/;`,
		`/[ !"#$]/;`,
		`/[ -$]/;`,
		`/\\d/;`,
		`/\\D/;`,
		`/[0-8]/;`,
		`/[1-9]/;`,
		`/[0-9a-z]/;`,
		`/[a-z0-9]/;`,
		`/foo/;`,
		`new RegExp("\\\\d");`,
		`new RegExp("\\\\D");`,
		`new RegExp("foo");`,
		`new RegExp(variable);`,
		String.raw`/[\q{a|b|c|d|e|f|abcdef}]/v;`,
	],
});
