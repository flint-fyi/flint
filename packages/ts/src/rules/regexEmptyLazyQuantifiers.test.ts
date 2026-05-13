import rule from "./regexEmptyLazyQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a??/;
`,
			snapshot: `
/a??/;
 ~~~
 Lazy quantifier 'a??' at end of pattern will only match the empty string.
`,
		},
		{
			code: `
/a*?/;
`,
			snapshot: `
/a*?/;
 ~~~
 Lazy quantifier 'a*?' at end of pattern will only match the empty string.
`,
		},
		{
			code: `
/a+?/;
`,
			snapshot: `
/a+?/;
 ~~~
 Lazy quantifier 'a+?' at end of pattern will always match exactly once.
`,
		},
		{
			code: `
/a{3,7}?/;
`,
			snapshot: `
/a{3,7}?/;
 ~~~~~~~
 Lazy quantifier 'a{3,7}?' at end of pattern will always match exactly 3 times.
`,
		},
		{
			code: `
/a{3,}?/;
`,
			snapshot: `
/a{3,}?/;
 ~~~~~~
 Lazy quantifier 'a{3,}?' at end of pattern will always match exactly 3 times.
`,
		},
		{
			code: `
/(?:a|bc+?)/;
`,
			snapshot: `
/(?:a|bc+?)/;
       ~~~
       Lazy quantifier 'c+?' at end of pattern will always match exactly once.
`,
		},
		{
			code: `
/a(?:c|ab+?)?/;
`,
			snapshot: `
/a(?:c|ab+?)?/;
        ~~~
        Lazy quantifier 'b+?' at end of pattern will always match exactly once.
`,
		},
		{
			code: `
new RegExp("a*?");
`,
			snapshot: `
new RegExp("a*?");
            ~~~
            Lazy quantifier 'a*?' at end of pattern will only match the empty string.
`,
		},
		{
			code: `
/foo.*?/;
`,
			snapshot: `
/foo.*?/;
    ~~~
    Lazy quantifier '.*?' at end of pattern will only match the empty string.
`,
		},
		{
			code: String.raw`
/[\s\S]*?/;
`,
			snapshot: String.raw`
/[\s\S]*?/;
 ~~~~~~~~
 Lazy quantifier '[\s\S]*?' at end of pattern will only match the empty string.
`,
		},
		{
			code: `
/(a+?)/;
`,
			snapshot: `
/(a+?)/;
  ~~~
  Lazy quantifier 'a+?' at end of pattern will always match exactly once.
`,
		},
		{
			code: `
/(?:ab+?|c)/;
`,
			snapshot: `
/(?:ab+?|c)/;
     ~~~
     Lazy quantifier 'b+?' at end of pattern will always match exactly once.
`,
		},
	],
	valid: [
		`/a+?b/;`,
		`/a??(?:ba+?|c)*/;`,
		`/ba*?$/;`,
		`/a?/;`,
		`/a{3}?/;`,
		`new RegExp("a+?b");`,
		`RegExp(variable);`,
		String.raw`/[\q{ab}]?/v;`,
	],
});
