import rule from "./regexUnnecessaryDisjunctions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\q{a}]/v;
`,
			output: String.raw`
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
			code: `
new RegExp("[\\\\q{a|bc}]", "v");
`,
			output: `
new RegExp("[a\\\\q{bc}]", "v");
`,
			snapshot: `
new RegExp("[\\\\q{a|bc}]", "v");
                ~
                This single-character disjunction alternative can be inlined into the surrounding character class.
`,
		},
		{
			code: `
RegExp("[\\\\q{a}]", "v");
`,
			output: `
RegExp("[a]", "v");
`,
			snapshot: `
RegExp("[\\\\q{a}]", "v");
            ~
            This single-character disjunction alternative can be inlined into the surrounding character class.
`,
		},
	],
	valid: [
		`/[\\q{ab|cd}]/v;`,
		`/[a]/v;`,
		`/[abc]/v;`,
		`new RegExp("[\\\\q{ab|cd}]", "v");`,
		`new RegExp(variable, "v");`,
		`/[\\q{ab}]/v;`,
	],
});
