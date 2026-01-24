import rule from "./regexContradictoryAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a\\b-?a/;
`,
			snapshot: `
/a\\b-?a/;
    ~~
    The quantifier '-?' is always entered despite having a minimum of 0.
`,
		},
		{
			code: `
/a\\ba*-/;
`,
			snapshot: `
/a\\ba*-/;
    ~~
    The quantifier 'a*' can never be entered because it contradicts the assertion '\\b'.
`,
		},
		{
			code: `
new RegExp("a\\\\b-?a");
`,
			snapshot: `
new RegExp("a\\\\b-?a");
                ~~
                The quantifier '-?' is always entered despite having a minimum of 0.
`,
		},
		{
			code: `
RegExp("a\\\\ba*-");
`,
			snapshot: `
RegExp("a\\\\ba*-");
            ~~
            The quantifier 'a*' can never be entered because it contradicts the assertion '\\\\b'.
`,
		},
		{
			code: `
/a\\b[a-z]?b/;
`,
			snapshot: `
/a\\b[a-z]?b/;
    ~~~~~~
    The quantifier '[a-z]?' can never be entered because it contradicts the assertion '\\b'.
`,
		},
	],
	valid: [
		`/a\\ba/;`,
		`/a\\b /;`,
		`/a\\b-/;`,
		`/\\ba/;`,
		`/a\\b/;`,
		`/\\bword\\b/;`,
		`/foo.*bar/;`,
		`new RegExp("a\\\\b");`,
		`new RegExp("foo");`,
		`RegExp("\\\\bword\\\\b");`,
		`new RegExp(variable);`,
	],
});
