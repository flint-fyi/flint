import rule from "./regexContradictoryAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/a\b-?a/;
`,
			snapshot: String.raw`
/a\b-?a/;
    ~~
    The quantifier '-?' is always entered despite having a minimum of 0.
`,
		},
		{
			code: String.raw`
/a\ba*-/;
`,
			snapshot: String.raw`
/a\ba*-/;
    ~~
    The quantifier 'a*' can never be entered because it contradicts the assertion '\b'.
`,
		},
		{
			code: String.raw`
new RegExp("a\\b-?a");
`,
			snapshot: String.raw`
new RegExp("a\\b-?a");
                ~~
                The quantifier '-?' is always entered despite having a minimum of 0.
`,
		},
		{
			code: String.raw`
RegExp("a\\ba*-");
`,
			snapshot: String.raw`
RegExp("a\\ba*-");
            ~~
            The quantifier 'a*' can never be entered because it contradicts the assertion '\\b'.
`,
		},
		{
			code: String.raw`
/a\b[a-z]?b/;
`,
			snapshot: String.raw`
/a\b[a-z]?b/;
    ~~~~~~
    The quantifier '[a-z]?' can never be entered because it contradicts the assertion '\b'.
`,
		},
	],
	valid: [
		String.raw`/a\ba/;`,
		String.raw`/a\b /;`,
		String.raw`/a\b-/;`,
		String.raw`/\ba/;`,
		String.raw`/a\b/;`,
		String.raw`/\bword\b/;`,
		`/foo.*bar/;`,
		String.raw`new RegExp("a\\b");`,
		`new RegExp("foo");`,
		String.raw`RegExp("\\bword\\b");`,
		`new RegExp(variable);`,
	],
});
