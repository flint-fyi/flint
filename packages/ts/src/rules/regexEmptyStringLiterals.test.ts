import rule from "./regexEmptyStringLiterals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\q{}]/v;
`,
			snapshot: `
/[\\q{}]/v;
  ~~~~
  This empty string literal in a character class will always match the empty string.
`,
		},
		{
			code: String.raw`
/[a\q{}]/v;
`,
			snapshot: `
/[a\\q{}]/v;
   ~~~~
   This empty string literal in a character class will always match the empty string.
`,
		},
		{
			code: String.raw`
/[\q{}b]/v;
`,
			snapshot: `
/[\\q{}b]/v;
  ~~~~
  This empty string literal in a character class will always match the empty string.
`,
		},
		{
			code: String.raw`
/[a\q{}b]/v;
`,
			snapshot: `
/[a\\q{}b]/v;
   ~~~~
   This empty string literal in a character class will always match the empty string.
`,
		},
		{
			code: `
new RegExp("[\\\\q{}]", "v");
`,
			snapshot: `
new RegExp("[\\\\q{}]", "v");
             ~~~~
             This empty string literal in a character class will always match the empty string.
`,
		},
	],
	valid: [
		`/[a]/;`,
		`/[abc]/;`,
		String.raw`/[\q{a}]/v;`,
		String.raw`/[\q{ab}]/v;`,
		String.raw`/[\q{a|b}]/v;`,
		String.raw`/[\q{a|}]/v;`,
		String.raw`/[\q{|a}]/v;`,
		`/[]/;`,
		`new RegExp("[a]");`,
		`new RegExp(variable);`,
	],
});
