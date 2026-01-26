import rule from "./regexUnusedQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a{1}/;
`,
			snapshot: `
/a{1}/;
 ~~~~
 Quantifier 'a{1}' is unnecessary because it matches exactly once.
`,
		},
		{
			code: `
/a{1,1}/;
`,
			snapshot: `
/a{1,1}/;
 ~~~~~~
 Quantifier 'a{1,1}' is unnecessary because it matches exactly once.
`,
		},
		{
			code: `
/(ab){1}/;
`,
			snapshot: `
/(ab){1}/;
 ~~~~~~~
 Quantifier '(ab){1}' is unnecessary because it matches exactly once.
`,
		},
		{
			code: `
/(ab){1}?/;
`,
			snapshot: `
/(ab){1}?/;
 ~~~~~~~~
 Quantifier '(ab){1}?' is unnecessary because it matches exactly once.
`,
		},
		{
			code: `
/[a-z]{1}/;
`,
			snapshot: `
/[a-z]{1}/;
 ~~~~~~~~
 Quantifier '[a-z]{1}' is unnecessary because it matches exactly once.
`,
		},
		{
			code: `
new RegExp("a{1}");
`,
			snapshot: `
new RegExp("a{1}");
            ~~~~
            Quantifier 'a{1}' is unnecessary because it matches exactly once.
`,
		},
		{
			code: `
RegExp("a{1,1}");
`,
			snapshot: `
RegExp("a{1,1}");
        ~~~~~~
        Quantifier 'a{1,1}' is unnecessary because it matches exactly once.
`,
		},
		{
			code: `
/(?:ab){1}/;
`,
			snapshot: `
/(?:ab){1}/;
 ~~~~~~~~~
 Quantifier '(?:ab){1}' is unnecessary because it matches exactly once.
`,
		},
	],
	valid: [
		`/a/;`,
		`/a?/;`,
		`/a*/;`,
		`/a+/;`,
		`/a{2}/;`,
		`/a{0,1}/;`,
		`/a{1,2}/;`,
		`/a{0,}/;`,
		`new RegExp("a+");`,
		`RegExp(variable);`,
	],
});
