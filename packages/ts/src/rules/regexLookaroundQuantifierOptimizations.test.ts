import rule from "./regexLookaroundQuantifierOptimizations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?=ba*)/;
`,
			snapshot: `
/(?=ba*)/;
     ~~
     Quantifier 'a*' at the end of the lookahead can be removed.
`,
		},
		{
			code: `
/(?=ba*)/v;
`,
			snapshot: `
/(?=ba*)/v;
     ~~
     Quantifier 'a*' at the end of the lookahead can be removed.
`,
		},
		{
			code: `
/(?=ba+)/;
`,
			snapshot: `
/(?=ba+)/;
     ~~
     Quantifier 'a+' at the end of the lookahead can be replaced with 'a'.
`,
		},
		{
			code: `
/(?=(?:a|b|abc*))/;
`,
			snapshot: `
/(?=(?:a|b|abc*))/;
             ~~
             Quantifier 'c*' at the end of the lookahead can be removed.
`,
		},
		{
			code: `
/(?=(?:a|b|abc+))/;
`,
			snapshot: `
/(?=(?:a|b|abc+))/;
             ~~
             Quantifier 'c+' at the end of the lookahead can be replaced with 'c'.
`,
		},
		{
			code: `
/(?=(?:a|b|abc{4,9}))/;
`,
			snapshot: `
/(?=(?:a|b|abc{4,9}))/;
             ~~~~~~
             Quantifier 'c{4,9}' at the end of the lookahead can be replaced with 'c{4}'.
`,
		},
		{
			code: `
/(?<=[a-c]*)/;
`,
			snapshot: `
/(?<=[a-c]*)/;
     ~~~~~~
     Quantifier '[a-c]*' at the start of the lookbehind can be removed.
`,
		},
		{
			code: `
/(?<=(?:d|c)*ab)/;
`,
			snapshot: `
/(?<=(?:d|c)*ab)/;
     ~~~~~~~~
     Quantifier '(?:d|c)*' at the start of the lookbehind can be removed.
`,
		},
		{
			code: `
/(?!ba*)/;
`,
			snapshot: `
/(?!ba*)/;
     ~~
     Quantifier 'a*' at the end of the negative lookahead can be removed.
`,
		},
		{
			code: `
/(?<!a+)/;
`,
			snapshot: `
/(?<!a+)/;
     ~~
     Quantifier 'a+' at the start of the negative lookbehind can be replaced with 'a'.
`,
		},
		{
			code: `
new RegExp("(?=ba*)");
`,
			snapshot: `
new RegExp("(?=ba*)");
                ~~
                Quantifier 'a*' at the end of the lookahead can be removed.
`,
		},
		{
			code: `
RegExp("(?<=a{2,})");
`,
			snapshot: `
RegExp("(?<=a{2,})");
            ~~~~~
            Quantifier 'a{2,}' at the start of the lookbehind can be replaced with 'a{2}'.
`,
		},
	],
	valid: [
		`/(?=(a*))\\w+\\1/;`,
		`/(?<=a{4})/;`,
		`/(?=a(?:(a)|b)*)/;`,
		`/(?=ab)/;`,
		`/(?<=cd)/;`,
		`/(?!ab)/;`,
		`/(?<!cd)/;`,
		`/(?=a{3})/;`,
		`new RegExp("(?=ab)");`,
		`RegExp(variable);`,
	],
});
