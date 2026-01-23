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
  Empty string literal in character class.
`,
		},
		{
			code: String.raw`
/[a\q{}]/v;
`,
			snapshot: `
/[a\\q{}]/v;
   ~~~~
   Empty string literal in character class.
`,
		},
		{
			code: String.raw`
/[\q{}b]/v;
`,
			snapshot: `
/[\\q{}b]/v;
  ~~~~
  Empty string literal in character class.
`,
		},
		{
			code: String.raw`
/[a\q{}b]/v;
`,
			snapshot: `
/[a\\q{}b]/v;
   ~~~~
   Empty string literal in character class.
`,
		},
		{
			code: `
new RegExp("[\\\\q{}]", "v");
`,
			snapshot: `
new RegExp("[\\\\q{}]", "v");
             ~~~~
             Empty string literal in character class.
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
