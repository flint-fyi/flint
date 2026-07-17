import rule from "./regexUnnecessaryBackreferences.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/(a\1)/;
`,
			snapshot: String.raw`
/(a\1)/;
   ~~
   Backreference '\1' will be ignored because it is inside the group it references.
`,
		},
		{
			code: String.raw`
/(\1a)/;
`,
			snapshot: String.raw`
/(\1a)/;
  ~~
  Backreference '\1' will be ignored because it is inside the group it references.
`,
		},
		{
			code: String.raw`
/(a)|\1/;
`,
			snapshot: String.raw`
/(a)|\1/;
     ~~
     Backreference '\1' will be ignored because it and the group '(a)' are in different alternatives.
`,
		},
		{
			code: String.raw`
/(?:(a)|\1)/;
`,
			snapshot: String.raw`
/(?:(a)|\1)/;
        ~~
        Backreference '\1' will be ignored because it and the group '(a)' are in different alternatives.
`,
		},
		{
			code: String.raw`
/\1(a)/;
`,
			snapshot: String.raw`
/\1(a)/;
 ~~
 Backreference '\1' will be ignored because it appears before the group '(a)' is defined.
`,
		},
		{
			code: String.raw`
/(?:\1(a))+/;
`,
			snapshot: String.raw`
/(?:\1(a))+/;
    ~~
    Backreference '\1' will be ignored because it appears before the group '(a)' is defined.
`,
		},
		{
			code: String.raw`
/(?<=(a)\1)b/;
`,
			snapshot: String.raw`
/(?<=(a)\1)b/;
        ~~
        Backreference '\1' will be ignored because it appears after the group '(a)' in a lookbehind.
`,
		},
		{
			code: String.raw`
/(?!(a))\w\1/;
`,
			snapshot: String.raw`
/(?!(a))\w\1/;
          ~~
          Backreference '\1' will be ignored because the group '(a)' is in a negative lookaround.
`,
		},
		{
			code: String.raw`
/(?<!(a))\w\1/;
`,
			snapshot: String.raw`
/(?<!(a))\w\1/;
           ~~
           Backreference '\1' will be ignored because the group '(a)' is in a negative lookaround.
`,
		},
		{
			code: String.raw`
new RegExp("\\1(a)");
`,
			snapshot: String.raw`
new RegExp("\\1(a)");
            ~~
            Backreference '\1' will be ignored because it appears before the group '(a)' is defined.
`,
		},
		{
			code: String.raw`
RegExp("(a)|\\1");
`,
			snapshot: String.raw`
RegExp("(a)|\\1");
            ~~
            Backreference '\1' will be ignored because it and the group '(a)' are in different alternatives.
`,
		},
		{
			code: String.raw`
/(?<name>a)\k<name>|\k<name>/;
`,
			snapshot: String.raw`
/(?<name>a)\k<name>|\k<name>/;
                    ~~~~~~~~
                    Backreference '\k<name>' will be ignored because it and the group '(?<name>a)' are in different alternatives.
`,
		},
	],
	valid: [
		String.raw`/(a)\1/;`,
		String.raw`/(a)(b)\1/;`,
		String.raw`/(a|b)\1/;`,
		String.raw`/(?=(a))\w\1/;`,
		String.raw`/(?<=(a))b\1/;`,
		String.raw`/(a)?\1/;`,
		`new RegExp(variable);`,
		`RegExp();`,
	],
});
