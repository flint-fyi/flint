import rule from "./regexStarQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a{0,}/;
`,
			output: `
/a*/;
`,
			snapshot: `
/a{0,}/;
  ~~~~
  Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
/a{0,}?/;
`,
			output: `
/a*?/;
`,
			snapshot: `
/a{0,}?/;
  ~~~~
  Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
/(a){0,}/;
`,
			output: `
/(a)*/;
`,
			snapshot: `
/(a){0,}/;
    ~~~~
    Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
/(a){0,}/v;
`,
			output: `
/(a)*/v;
`,
			snapshot: `
/(a){0,}/v;
    ~~~~
    Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
/(a){0,}?/;
`,
			output: `
/(a)*?/;
`,
			snapshot: `
/(a){0,}?/;
    ~~~~
    Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
new RegExp("a{0,}");
`,
			output: `
new RegExp("a*");
`,
			snapshot: `
new RegExp("a{0,}");
             ~~~~
             Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
RegExp("a{0,}");
`,
			output: `
RegExp("a*");
`,
			snapshot: `
RegExp("a{0,}");
         ~~~~
         Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
/[abc]{0,}/;
`,
			output: `
/[abc]*/;
`,
			snapshot: `
/[abc]{0,}/;
      ~~~~
      Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
		{
			code: `
/(?:foo){0,}/;
`,
			output: `
/(?:foo)*/;
`,
			snapshot: `
/(?:foo){0,}/;
        ~~~~
        Prefer the more succinct '*' quantifier instead of '{0,}'.
`,
		},
	],
	valid: [
		`/a*/;`,
		`/a*?/;`,
		`/(a*)/;`,
		`/(a*?)/;`,
		`/[a{0,}]/;`,
		`/a{0,10}/;`,
		`/a{1,}/;`,
		`/a+/;`,
		`/a?/;`,
		`/a{2}/;`,
		`new RegExp("a*");`,
		`new RegExp(variable);`,
		`RegExp("a*");`,
		`RegExp();`,
		`RegExp(123);`,
	],
});
