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
   Backreference '\\1' will be ignored because it is inside the group it references.
`,
		},
		{
			code: `
/(\\1a)/;
`,
			snapshot: `
/(\\1a)/;
  ~~
  Backreference '\\1' will be ignored because it is inside the group it references.
`,
		},
		{
			code: `
/(a)|\\1/;
`,
			snapshot: `
/(a)|\\1/;
     ~~
     Backreference '\\1' will be ignored because it and the group '(a)' are in different alternatives.
`,
		},
		{
			code: `
/(?:(a)|\\1)/;
`,
			snapshot: `
/(?:(a)|\\1)/;
        ~~
        Backreference '\\1' will be ignored because it and the group '(a)' are in different alternatives.
`,
		},
		{
			code: `
/\\1(a)/;
`,
			snapshot: `
/\\1(a)/;
 ~~
 Backreference '\\1' will be ignored because it appears before the group '(a)' is defined.
`,
		},
		{
			code: `
/(?:\\1(a))+/;
`,
			snapshot: `
/(?:\\1(a))+/;
    ~~
    Backreference '\\1' will be ignored because it appears before the group '(a)' is defined.
`,
		},
		{
			code: `
/(?<=(a)\\1)b/;
`,
			snapshot: `
/(?<=(a)\\1)b/;
        ~~
        Backreference '\\1' will be ignored because it appears after the group '(a)' in a lookbehind.
`,
		},
		{
			code: `
/(?!(a))\\w\\1/;
`,
			snapshot: `
/(?!(a))\\w\\1/;
          ~~
          Backreference '\\1' will be ignored because the group '(a)' is in a negative lookaround.
`,
		},
		{
			code: `
/(?<!(a))\\w\\1/;
`,
			snapshot: `
/(?<!(a))\\w\\1/;
           ~~
           Backreference '\\1' will be ignored because the group '(a)' is in a negative lookaround.
`,
		},
		{
			code: `
new RegExp("\\\\1(a)");
`,
			snapshot: `
new RegExp("\\\\1(a)");
            ~~
            Backreference '\\1' will be ignored because it appears before the group '(a)' is defined.
`,
		},
		{
			code: `
RegExp("(a)|\\\\1");
`,
			snapshot: `
RegExp("(a)|\\\\1");
            ~~
            Backreference '\\1' will be ignored because it and the group '(a)' are in different alternatives.
`,
		},
		{
			code: `
/(?<name>a)\\k<name>|\\k<name>/;
`,
			snapshot: `
/(?<name>a)\\k<name>|\\k<name>/;
                    ~~~~~~~~
                    Backreference '\\k<name>' will be ignored because it and the group '(?<name>a)' are in different alternatives.
`,
		},
	],
	valid: [
		`/(a)\\1/;`,
		`/(a)(b)\\1/;`,
		`/(a|b)\\1/;`,
		`/(?=(a))\\w\\1/;`,
		`/(?<=(a))b\\1/;`,
		`/(a)?\\1/;`,
		`new RegExp(variable);`,
		`RegExp();`,
	],
});
