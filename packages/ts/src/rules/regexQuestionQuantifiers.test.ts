import rule from "./regexQuestionQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a{0,1}/;
`,
			output: `
/a?/;
`,
			snapshot: `
/a{0,1}/;
  ~~~~~
  Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
/a{0,1}?/;
`,
			output: `
/a??/;
`,
			snapshot: `
/a{0,1}?/;
  ~~~~~
  Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
/(a){0,1}/;
`,
			output: `
/(a)?/;
`,
			snapshot: `
/(a){0,1}/;
    ~~~~~
    Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
/(a){0,1}/v;
`,
			output: `
/(a)?/v;
`,
			snapshot: `
/(a){0,1}/v;
    ~~~~~
    Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
/(a){0,1}?/;
`,
			output: `
/(a)??/;
`,
			snapshot: `
/(a){0,1}?/;
    ~~~~~
    Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
new RegExp("a{0,1}");
`,
			output: `
new RegExp("a?");
`,
			snapshot: `
new RegExp("a{0,1}");
             ~~~~~
             Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
RegExp("a{0,1}");
`,
			output: `
RegExp("a?");
`,
			snapshot: `
RegExp("a{0,1}");
         ~~~~~
         Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
/[abc]{0,1}/;
`,
			output: `
/[abc]?/;
`,
			snapshot: `
/[abc]{0,1}/;
      ~~~~~
      Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
/(?:foo){0,1}/;
`,
			output: `
/(?:foo)?/;
`,
			snapshot: `
/(?:foo){0,1}/;
        ~~~~~
        Prefer the more succinct \`?\` quantifier instead of '{0,1}'.
`,
		},
		{
			code: `
/(?:abc|)/;
`,
			output: `
/(?:abc)?/;
`,
			snapshot: `
/(?:abc|)/;
 ~~~~~~~~
 Prefer optional group syntax using \`?\` instead of a trailing empty alternative.
`,
		},
		{
			code: `
/(?:a|b|)/;
`,
			output: `
/(?:a|b)?/;
`,
			snapshot: `
/(?:a|b|)/;
 ~~~~~~~~
 Prefer optional group syntax using \`?\` instead of a trailing empty alternative.
`,
		},
		{
			code: `
new RegExp("(?:abc|)");
`,
			output: `
new RegExp("(?:abc)?");
`,
			snapshot: `
new RegExp("(?:abc|)");
            ~~~~~~~~
            Prefer optional group syntax using \`?\` instead of a trailing empty alternative.
`,
		},
	],
	valid: [
		`/a?/;`,
		`/a??/;`,
		`/(abc|)/;`,
		`/(?:|abc)/;`,
		`/(?:abc|)?/;`,
		`/a{0,2}/;`,
		`/a{1,1}/;`,
		`/a{1,}/;`,
		`/a{0,}/;`,
		`/[a{0,1}]/;`,
		`new RegExp("a?");`,
		`new RegExp(variable);`,
		`RegExp("a?");`,
		`RegExp();`,
		`RegExp(123);`,
	],
});
