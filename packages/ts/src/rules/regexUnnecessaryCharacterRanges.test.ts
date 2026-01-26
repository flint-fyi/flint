import rule from "./regexUnnecessaryCharacterRanges.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[a-a]/;
`,
			snapshot: `
/[a-a]/;
  ~~~
  This character range spans only one character.
`,
		},
		{
			code: `
/[a-b]/;
`,
			snapshot: `
/[a-b]/;
  ~~~
  This character range spans only two adjacent characters.
`,
		},
		{
			code: `
/[a-a0-1]/;
`,
			snapshot: `
/[a-a0-1]/;
  ~~~
  This character range spans only one character.
     ~~~
     This character range spans only two adjacent characters.
`,
		},
		{
			code: `
/[^a-a]/;
`,
			snapshot: `
/[^a-a]/;
   ~~~
   This character range spans only one character.
`,
		},
		{
			code: `
/[xya-bz]/;
`,
			snapshot: `
/[xya-bz]/;
    ~~~
    This character range spans only two adjacent characters.
`,
		},
		{
			code: `
new RegExp("[a-a]");
`,
			snapshot: `
new RegExp("[a-a]");
             ~~~
             This character range spans only one character.
`,
		},
		{
			code: `
RegExp("[a-b]");
`,
			snapshot: `
RegExp("[a-b]");
         ~~~
         This character range spans only two adjacent characters.
`,
		},
	],
	valid: [
		`/[a]/;`,
		`/[a-c]/;`,
		`/[0-9]/;`,
		`/[-a]/;`,
		`/[a-]/;`,
		`/[a-z]/;`,
		`/[A-Z]/;`,
		`new RegExp("[a-z]");`,
		`new RegExp(variable);`,
	],
});
