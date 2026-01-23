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
/a|ab/;
`,
			snapshot: `
/a|ab/;
   ~~
   Alternative 'ab' is already covered by 'a' and is unreachable.
`,
		},
		{
			code: `
/foo|foobar/;
`,
			snapshot: `
/foo|foobar/;
     ~~~~~~
     Alternative 'foobar' is already covered by 'foo' and is unreachable.
`,
		},

		{
			code: `
/\\w|a/;
`,
			snapshot: `
/\\w|a/;
    ~
    Alternative 'a' is a subset of '\\w' and is unreachable.
`,
		},
		{
			code: `
/[a-z]|b/;
`,
			snapshot: `
/[a-z]|b/;
       ~
       Alternative 'b' is a subset of '[a-z]' and is unreachable.
`,
		},
		{
			code: `
/.|abc/;
`,
			snapshot: `
/.|abc/;
   ~~~
   Alternative 'abc' is already covered by '.' and is unreachable.
`,
		},

		{
			code: `
/(?=a|a)/;
`,
			snapshot: `
/(?=a|a)/;
      ~
      Duplicate alternative 'a' in disjunction.
`,
		},

		{
			code: `
/(?<=a|a)/;
`,
			snapshot: `
/(?<=a|a)/;
       ~
       Duplicate alternative 'a' in disjunction.
`,
		},

		{
			code: `
/a|A/i;
`,
			snapshot: `
/a|A/i;
   ~
   Duplicate alternative 'A' in disjunction.
`,
		},

		{
			code: `
/(?:[ab]|[ba])/;
`,
			snapshot: `
/(?:[ab]|[ba])/;
         ~~~~
         Duplicate alternative '[ba]' in disjunction.
`,
		},

		{
			code: `
new RegExp("\\\\w|a");
`,
			snapshot: `
new RegExp("\\\\w|a");
                ~
                Alternative 'a' is a subset of '\\w' and is unreachable.
`,
		},

		{
			code: `
/\\d|\\w/;
`,
			snapshot: `
/\\d|\\w/;
 ~~
 Alternative '\\d' is a subset of '\\w' and is unreachable.
`,
		},

		{
			code: `
/(?:a+|a)+/;
`,
			snapshot: `
/(?:a+|a)+/;
       ~
       Alternative 'a' is a subset of 'a+' and is unreachable.
`,
		},

		{
			code: `
/((?:ab|ba)|(?:ab|ba))/;
`,
			snapshot: `
/((?:ab|ba)|(?:ab|ba))/;
            ~~~~~~~~~
            Duplicate alternative '(?:ab|ba)' in disjunction.
`,
		},

		{
			code: `
/\\w|abc|123|_|[A-Z]/;
`,
			snapshot: `
/\\w|abc|123|_|[A-Z]/;
            ~
            Alternative '_' is a subset of '\\w' and is unreachable.
              ~~~~~
              Alternative '[A-Z]' is a subset of '\\w' and is unreachable.
    ~~~
    Alternative 'abc' is already covered by '\\w' and is unreachable.
        ~~~
        Alternative '123' is already covered by '\\w' and is unreachable.
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
		`/(?:a|ab)c/;`,
		`/ya?ml|json/;`,
		String.raw`/^\s*(eslint-(?:en|dis)able)(?:\s+(\S|\S[\s\S]*\S))?\s*$/u;`,
		String.raw`/<("[^"]*"|'[^']*'|[^'">])*>/g;`,
		String.raw`/b+(?:\w+|[+-]?\d+)/;`,
		String.raw`/\d*\.\d+_|\d+\.\d*_/;`,
		String.raw`/\d*\.\d+|\d+\.\d*/;`,
	],
});
