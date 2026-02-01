import rule from "./regexZeroQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a{0}/;
`,
			output: `
/(?:)/;
`,
			snapshot: `
/a{0}/;
 ~~~~
 Quantifier 'a{0}' has a maximum of 0 and is useless.
`,
		},
		{
			code: `
/a{0,0}/;
`,
			output: `
/(?:)/;
`,
			snapshot: `
/a{0,0}/;
 ~~~~~~
 Quantifier 'a{0,0}' has a maximum of 0 and is useless.
`,
		},
		{
			code: `
/(ab){0}/;
`,
			output: `
/(?:)/;
`,
			snapshot: `
/(ab){0}/;
 ~~~~~~~
 Quantifier '(ab){0}' has a maximum of 0 and is useless.
`,
		},
		{
			code: `
/[a-z]{0}/;
`,
			output: `
/(?:)/;
`,
			snapshot: `
/[a-z]{0}/;
 ~~~~~~~~
 Quantifier '[a-z]{0}' has a maximum of 0 and is useless.
`,
		},
		{
			code: `
new RegExp("a{0}");
`,
			output: `
new RegExp("");
`,
			snapshot: `
new RegExp("a{0}");
            ~~~~
            Quantifier 'a{0}' has a maximum of 0 and is useless.
`,
		},
		{
			code: `
/a{0}?/;
`,
			output: `
/(?:)/;
`,
			snapshot: `
/a{0}?/;
 ~~~~~
 Quantifier 'a{0}?' has a maximum of 0 and is useless.
`,
		},
		{
			code: `
/(?:foo|bar){0}/;
`,
			output: `
/(?:)/;
`,
			snapshot: `
/(?:foo|bar){0}/;
 ~~~~~~~~~~~~~~
 Quantifier '(?:foo|bar){0}' has a maximum of 0 and is useless.
`,
		},
	],
	valid: [
		`/a{0,1}/;`,
		`/a{0,}/;`,
		`/a*/;`,
		`/a?/;`,
		`/a+/;`,
		`/a{1}/;`,
		`/a{1,2}/;`,
		`new RegExp("a+");`,
		`RegExp(variable);`,
	],
});
