import rule from "./regexUnnecessaryDisjunctions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[\\q{a}]/v;
`,
			snapshot: `
/[\\q{a}]/v;
     ~
     This string disjunction alternative contains only a single character.
`,
		},
		{
			code: `
/[\\q{a|bc}]/v;
`,
			snapshot: `
/[\\q{a|bc}]/v;
     ~
     This string disjunction alternative contains only a single character.
`,
		},
		{
			code: `
/[\\q{ab|c|de}]/v;
`,
			snapshot: `
/[\\q{ab|c|de}]/v;
        ~
        This string disjunction alternative contains only a single character.
`,
		},
		{
			code: `
new RegExp("[\\\\q{a|bc}]", "v");
`,
			snapshot: `
new RegExp("[\\\\q{a|bc}]", "v");
                ~
                This string disjunction alternative contains only a single character.
`,
		},
		{
			code: `
RegExp("[\\\\q{a}]", "v");
`,
			snapshot: `
RegExp("[\\\\q{a}]", "v");
            ~
            This string disjunction alternative contains only a single character.
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
