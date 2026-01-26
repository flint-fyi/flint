import rule from "./regexPlusQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a{1,}/;
`,
			output: `
/a+/;
`,
			snapshot: `
/a{1,}/;
  ~~~~
  Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
/a{1,}?/;
`,
			output: `
/a+?/;
`,
			snapshot: `
/a{1,}?/;
  ~~~~
  Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
/(a){1,}/;
`,
			output: `
/(a)+/;
`,
			snapshot: `
/(a){1,}/;
    ~~~~
    Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
/(a){1,}/v;
`,
			output: `
/(a)+/v;
`,
			snapshot: `
/(a){1,}/v;
    ~~~~
    Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
/(a){1,}?/;
`,
			output: `
/(a)+?/;
`,
			snapshot: `
/(a){1,}?/;
    ~~~~
    Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
new RegExp("a{1,}");
`,
			output: `
new RegExp("a+");
`,
			snapshot: `
new RegExp("a{1,}");
             ~~~~
             Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
RegExp("a{1,}");
`,
			output: `
RegExp("a+");
`,
			snapshot: `
RegExp("a{1,}");
         ~~~~
         Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
/[abc]{1,}/;
`,
			output: `
/[abc]+/;
`,
			snapshot: `
/[abc]{1,}/;
      ~~~~
      Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
		{
			code: `
/(?:foo){1,}/;
`,
			output: `
/(?:foo)+/;
`,
			snapshot: `
/(?:foo){1,}/;
        ~~~~
        Prefer the more succinct \`+\` quantifier instead of \`{1,}\`.
`,
		},
	],
	valid: [
		`/a+/;`,
		`/a+?/;`,
		`/(a+)/;`,
		`/(a+?)/;`,
		`/[a{1,}]/;`,
		`/a{1,10}/;`,
		`/a{2,}/;`,
		`/a{0,}/;`,
		`/a*/;`,
		`/a?/;`,
		`/a{2}/;`,
		`new RegExp("a+");`,
		`new RegExp(variable);`,
		`RegExp("a+");`,
		`RegExp();`,
		`RegExp(123);`,
	],
});
