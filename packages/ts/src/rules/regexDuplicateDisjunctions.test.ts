import rule from "./regexDuplicateDisjunctions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a|a/;
`,
			snapshot: `
/a|a/;
   ~
   Duplicate alternative 'a' in disjunction.
`,
		},
		{
			code: `
/(a|a)/;
`,
			snapshot: `
/(a|a)/;
    ~
    Duplicate alternative 'a' in disjunction.
`,
		},
		{
			code: `
/(?:a|a)/;
`,
			snapshot: `
/(?:a|a)/;
      ~
      Duplicate alternative 'a' in disjunction.
`,
		},
		{
			code: `
/(?:[ab]|[ab])/;
`,
			snapshot: `
/(?:[ab]|[ab])/;
         ~~~~
         Duplicate alternative '[ab]' in disjunction.
`,
		},
		{
			code: `
/(?:ab|ab)/;
`,
			snapshot: `
/(?:ab|ab)/;
       ~~
       Duplicate alternative 'ab' in disjunction.
`,
		},
		{
			code: `
/a|ab/;
`,
			snapshot: `
/a|ab/;
   ~~
   Alternative 'ab' is a subset of 'a' and is unreachable.
`,
		},
		{
			code: `
new RegExp("a|a");
`,
			snapshot: `
new RegExp("a|a");
              ~
              Duplicate alternative 'a' in disjunction.
`,
		},
		{
			code: `
/abc|def|abc/;
`,
			snapshot: `
/abc|def|abc/;
         ~~~
         Duplicate alternative 'abc' in disjunction.
`,
		},
		{
			code: `
/foo|foobar/;
`,
			snapshot: `
/foo|foobar/;
     ~~~~~~
     Alternative 'foobar' is a subset of 'foo' and is unreachable.
`,
		},
	],
	valid: [
		`/a|b/;`,
		`/(a|b)/;`,
		`/(?:a|b)/;`,
		`/(?:js|json)$/;`,
		`/c+|[a-f]/;`,
		`new RegExp("a|b");`,
		`new RegExp(variable);`,
		`/ab|ba/;`,
	],
});
