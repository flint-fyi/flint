// spellchecker:disable
import rule from "./regexUnnecessaryCharacterRanges.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[a-a]/;
`,
			output: `
/[a]/;
`,
			snapshot: `
/[a-a]/;
  ~~~
  This single-character range can be simplified to just the character.
`,
		},
		{
			code: `
/[a-b]/;
`,
			output: `
/[ab]/;
`,
			snapshot: `
/[a-b]/;
  ~~~
  This two-character range can be simplified to omit the hyphen.
`,
		},
		{
			code: `
/[a-a0-1]/;
`,
			output: `
/[a01]/;
`,
			snapshot: `
/[a-a0-1]/;
  ~~~
  This single-character range can be simplified to just the character.
     ~~~
     This two-character range can be simplified to omit the hyphen.
`,
		},
		{
			code: `
/[^a-a]/;
`,
			output: `
/[^a]/;
`,
			snapshot: `
/[^a-a]/;
   ~~~
   This single-character range can be simplified to just the character.
`,
		},
		{
			code: `
/[xya-bz]/;
`,
			output: `
/[xyabz]/;
`,
			snapshot: `
/[xya-bz]/;
    ~~~
    This two-character range can be simplified to omit the hyphen.
`,
		},
		{
			code: `
new RegExp("[a-a]");
`,
			output: `
new RegExp("[a]");
`,
			snapshot: `
new RegExp("[a-a]");
             ~~~
             This single-character range can be simplified to just the character.
`,
		},
		{
			code: `
RegExp("[a-b]");
`,
			output: `
RegExp("[ab]");
`,
			snapshot: `
RegExp("[a-b]");
         ~~~
         This two-character range can be simplified to omit the hyphen.
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
