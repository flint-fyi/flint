import rule from "./regexUnnecessaryNumericQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a{1,1}/;
`,
			snapshot: `
/a{1,1}/;
  ~~~~~
  This numeric quantifier \`{1,1}\` can be simplified to \`{1}\`.
`,
		},
		{
			code: `
/a{42,42}/;
`,
			snapshot: `
/a{42,42}/;
  ~~~~~~~
  This numeric quantifier \`{42,42}\` can be simplified to \`{42}\`.
`,
		},
		{
			code: `
/(?:ab){2,2}/;
`,
			snapshot: `
/(?:ab){2,2}/;
       ~~~~~
       This numeric quantifier \`{2,2}\` can be simplified to \`{2}\`.
`,
		},
		{
			code: `
/a{1,1}b{2,2}/;
`,
			snapshot: `
/a{1,1}b{2,2}/;
  ~~~~~
  This numeric quantifier \`{1,1}\` can be simplified to \`{1}\`.
        ~~~~~
        This numeric quantifier \`{2,2}\` can be simplified to \`{2}\`.
`,
		},
		{
			code: `
/a{1,1}?/;
`,
			snapshot: `
/a{1,1}?/;
  ~~~~~~
  This numeric quantifier \`{1,1}?\` can be simplified to \`{1}?\`.
`,
		},
		{
			code: `
new RegExp("a{1,1}");
`,
			snapshot: `
new RegExp("a{1,1}");
             ~~~~~
             This numeric quantifier \`{1,1}\` can be simplified to \`{1}\`.
`,
		},
	],
	valid: [
		`/a{1,2}/;`,
		`/a{1,}/;`,
		`/a{1}/;`,
		`/a+/;`,
		`/a*/;`,
		`/a?/;`,
		`new RegExp("a{1}");`,
		`RegExp(variable);`,
	],
});
