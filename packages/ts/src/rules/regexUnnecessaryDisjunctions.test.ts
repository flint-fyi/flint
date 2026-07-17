import rule from "./regexUnnecessaryDisjunctions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\q{a}]/v;
`,
			output: `
/[a]/v;
`,
			snapshot: String.raw`
/[\q{a}]/v;
     ~
     This single-character disjunction alternative can be inlined into the surrounding character class.
`,
		},
		{
			code: String.raw`
/[\q{a|bc}]/v;
`,
			output: String.raw`
/[a\q{bc}]/v;
`,
			snapshot: String.raw`
/[\q{a|bc}]/v;
     ~
     This single-character disjunction alternative can be inlined into the surrounding character class.
`,
		},
		{
			code: String.raw`
/[\q{ab|c|de}]/v;
`,
			output: String.raw`
/[c\q{ab|de}]/v;
`,
			snapshot: String.raw`
/[\q{ab|c|de}]/v;
        ~
        This single-character disjunction alternative can be inlined into the surrounding character class.
`,
		},
		{
			code: String.raw`
new RegExp("[\\q{a|bc}]", "v");
`,
			output: String.raw`
new RegExp("[a\\q{bc}]", "v");
`,
			snapshot: String.raw`
new RegExp("[\\q{a|bc}]", "v");
                ~
                This single-character disjunction alternative can be inlined into the surrounding character class.
`,
		},
		{
			code: String.raw`
RegExp("[\\q{a}]", "v");
`,
			output: `
RegExp("[a]", "v");
`,
			snapshot: String.raw`
RegExp("[\\q{a}]", "v");
            ~
            This single-character disjunction alternative can be inlined into the surrounding character class.
`,
		},
	],
	valid: [
		String.raw`/[\q{ab|cd}]/v;`,
		`/[a]/v;`,
		`/[abc]/v;`,
		String.raw`new RegExp("[\\q{ab|cd}]", "v");`,
		`new RegExp(variable, "v");`,
		String.raw`/[\q{ab}]/v;`,
	],
});
