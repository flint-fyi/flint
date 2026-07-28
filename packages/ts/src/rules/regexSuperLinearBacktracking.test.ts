import rule from "./regexSuperLinearBacktracking.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/b(?:a+)+b/;
`,
			snapshot: `
/b(?:a+)+b/;
     ~~
     Quantifier 'a+' can reach itself via '(?:a+)+', causing exponential backtracking.
`,
		},
		{
			code: `
/(?:ba+|a+b){2}/;
`,
			snapshot: `
/(?:ba+|a+b){2}/;
     ~~~~~
     Quantifiers 'a+' and 'a+' can exchange characters, causing polynomial backtracking.
`,
		},
		{
			code: String.raw`
/\ba+a+$/;
`,
			snapshot: String.raw`
/\ba+a+$/;
   ~~~~
   Quantifiers 'a+' and 'a+' can exchange characters, causing polynomial backtracking.
`,
		},
		{
			code: String.raw`
/\b\w+a\w+$/;
`,
			snapshot: String.raw`
/\b\w+a\w+$/;
   ~~~~~~~
   Quantifiers '\w+' and '\w+' can exchange characters, causing polynomial backtracking.
`,
		},
		{
			code: String.raw`
/\b\w+a?b{4}\w+$/;
`,
			snapshot: String.raw`
/\b\w+a?b{4}\w+$/;
   ~~~~~~~~~~~~
   Quantifiers '\w+' and '\w+' can exchange characters, causing polynomial backtracking.
`,
		},
		{
			code: `
new RegExp("b(?:a+)+b");
`,
			snapshot: `
new RegExp("b(?:a+)+b");
                ~~
                Quantifier 'a+' can reach itself via '(?:a+)+', causing exponential backtracking.
`,
		},
		{
			code: String.raw`
RegExp("\\ba+a+$");
`,
			snapshot: String.raw`
RegExp("\\ba+a+$");
           ~~~~
           Quantifiers 'a+' and 'a+' can exchange characters, causing polynomial backtracking.
`,
		},
	],
	valid: [
		"/regexp/;",
		"/a+b+a+b+/;",
		String.raw`/\w+\b[\w-]+/;`,
		"/(?:a+)+/;",
		`/a/;`,
		`/a+/;`,
		`/a*b+/;`,
		`new RegExp("a+b+");`,
		`new RegExp("(?:a+)+");`,
		`RegExp("a*");`,
		`RegExp(variable);`,
		`/[/;`,
		`new RegExp("[");`,
		`/;`,
	],
});
