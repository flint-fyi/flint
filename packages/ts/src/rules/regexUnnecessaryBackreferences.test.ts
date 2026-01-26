import rule from "./regexUnnecessaryBackreferences.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(a\\1)/;
`,
			snapshot: `
/(a\\1)/;
   ~~
   Backreference '\\1' is inside the group it references and always matches empty.
`,
		},
		{
			code: `
/(\\1)/;
`,
			snapshot: `
/(\\1)/;
  ~~
  Backreference '\\1' is inside the group it references and always matches empty.
`,
		},
		{
			code: `
/\\1(a)/;
`,
			snapshot: `
/\\1(a)/;
 ~~
 Backreference '\\1' appears before its capturing group is defined.
`,
		},
		{
			code: `
/(a)\\2(b)/;
`,
			snapshot: `
/(a)\\2(b)/;
    ~~
    Backreference '\\2' appears before its capturing group is defined.
`,
		},
		{
			code: `
/(a)|\\1b/;
`,
			snapshot: `
/(a)|\\1b/;
     ~~
     Backreference '\\1' and its capturing group are in different alternation branches.
`,
		},
		{
			code: `
new RegExp("(a\\\\1)");
`,
			snapshot: `
new RegExp("(a\\\\1)");
              ~~~
              Backreference '\\\\1' is inside the group it references and always matches empty.
`,
		},
		{
			code: `
RegExp("\\\\1(a)");
`,
			snapshot: `
RegExp("\\\\1(a)");
        ~~~
        Backreference '\\\\1' appears before its capturing group is defined.
`,
		},
		{
			code: `
/(a)|\\1(b)/;
`,
			snapshot: `
/(a)|\\1(b)/;
     ~~
     Backreference '\\1' and its capturing group are in different alternation branches.
`,
		},

		{
			code: `
/(?:(a)|\\1)+/;
`,
			snapshot: `
/(?:(a)|\\1)+/;
        ~~
        Backreference '\\1' and its capturing group are in different alternation branches.
`,
		},
	],
	valid: [
		`/(a)\\1/;`,
		`/(a|b)\\1/;`,
		`/(?:a|(b))\\1/;`,
		`/\\1/;`,
		`/[\\1]/;`,
		`new RegExp(variable);`,
		`/(a)(b)\\1\\2/;`,
		`/(?<name>a)\\k<name>/;`,
		`/((a)\\2)/;`,
	],
});
