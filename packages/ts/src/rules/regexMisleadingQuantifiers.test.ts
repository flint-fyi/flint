import rule from "./regexMisleadingQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(a?){5}/;
`,
			snapshot: `
/(a?){5}/;
 ~~~~~~~
 Quantifier minimum is 5 but the element can match empty. Consider using '{0,5}' instead.
`,
		},
		{
			code: String.raw`
/(?:a?b*|c+){4}/;
`,
			snapshot: String.raw`
/(?:a?b*|c+){4}/;
 ~~~~~~~~~~~~~~
 Quantifier minimum is 4 but the element can match empty. Consider using '{0,4}' instead.
`,
		},
		{
			code: `
/(a?)+/;
`,
			snapshot: `
/(a?)+/;
 ~~~~~
 Quantifier minimum is 1 but the element can match empty. Consider using '*' instead.
`,
		},
		{
			code: `
/(a*){3}/;
`,
			snapshot: `
/(a*){3}/;
 ~~~~~~~
 Quantifier minimum is 3 but the element can match empty. Consider using '{0,3}' instead.
`,
		},
		{
			code: `
/(a|b?){2}/;
`,
			snapshot: `
/(a|b?){2}/;
 ~~~~~~~~~
 Quantifier minimum is 2 but the element can match empty. Consider using '{0,2}' instead.
`,
		},
		{
			code: `
new RegExp("(a?){5}");
`,
			snapshot: `
new RegExp("(a?){5}");
            ~~~~~~~
            Quantifier minimum is 5 but the element can match empty. Consider using '{0,5}' instead.
`,
		},
		{
			code: `
/(a?){2,5}/;
`,
			snapshot: `
/(a?){2,5}/;
 ~~~~~~~~~
 Quantifier minimum is 2 but the element can match empty. Consider using '{0,5}' instead.
`,
		},
		{
			code: `
/(a?){3,}/;
`,
			snapshot: `
/(a?){3,}/;
 ~~~~~~~~
 Quantifier minimum is 3 but the element can match empty. Consider using '*' instead.
`,
		},
	],
	valid: [
		`/a+/;`,
		`/a?/;`,
		`/(a|b?)*/;`,
		`/(a?){0,3}/;`,
		`/a{3}/;`,
		`/(abc)+/;`,
		`new RegExp("a+");`,
		`RegExp(variable);`,
	],
});
