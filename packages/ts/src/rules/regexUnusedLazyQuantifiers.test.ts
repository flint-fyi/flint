import rule from "./regexUnusedLazyQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a{1}?/;
`,
			output: `
/a{1}/;
`,
			snapshot: `
/a{1}?/;
 ~~~~~
 Lazy quantifier \`a{1}?\` has no effect because the quantifier matches exactly 1 time(s).
`,
		},
		{
			code: `
/a{4}?/;
`,
			output: `
/a{4}/;
`,
			snapshot: `
/a{4}?/;
 ~~~~~
 Lazy quantifier \`a{4}?\` has no effect because the quantifier matches exactly 4 time(s).
`,
		},
		{
			code: `
/a{2,2}?/;
`,
			output: `
/a{2,2}/;
`,
			snapshot: `
/a{2,2}?/;
 ~~~~~~~
 Lazy quantifier \`a{2,2}?\` has no effect because the quantifier matches exactly 2 time(s).
`,
		},
		{
			code: `
/(ab){2}?/;
`,
			output: `
/(ab){2}/;
`,
			snapshot: `
/(ab){2}?/;
 ~~~~~~~~
 Lazy quantifier \`(ab){2}?\` has no effect because the quantifier matches exactly 2 time(s).
`,
		},
		{
			code: `
/[a-z]{3}?/;
`,
			output: `
/[a-z]{3}/;
`,
			snapshot: `
/[a-z]{3}?/;
 ~~~~~~~~~
 Lazy quantifier \`[a-z]{3}?\` has no effect because the quantifier matches exactly 3 time(s).
`,
		},
		{
			code: `
new RegExp("a{2}?");
`,
			output: `
new RegExp("a{2}");
`,
			snapshot: `
new RegExp("a{2}?");
            ~~~~~
            Lazy quantifier \`a{2}?\` has no effect because the quantifier matches exactly 2 time(s).
`,
		},
	],
	valid: [
		`/a{1}/;`,
		`/a{4}/;`,
		`/a*?/;`,
		`/a+?/;`,
		`/a??/;`,
		`/a{1,3}?/;`,
		`/a{2,}?/;`,
		`new RegExp("a{1,3}?");`,
		`RegExp(variable);`,
	],
});
