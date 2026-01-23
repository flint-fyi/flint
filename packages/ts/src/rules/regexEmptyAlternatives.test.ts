import rule from "./regexEmptyAlternatives.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/a|/;
`,
			snapshot: `
/a|/;
  ~
  Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/|a/;
`,
			snapshot: `
/|a/;
 ~
 Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/a||b/;
`,
			snapshot: `
/a||b/;
   ~
   Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(a|)/;
`,
			snapshot: `
/(a|)/;
   ~
   Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(|a)/;
`,
			snapshot: `
/(|a)/;
  ~
  Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(?:a|)/;
`,
			snapshot: `
/(?:a|)/;
     ~
     Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
new RegExp("a|");
`,
			snapshot: `
new RegExp("a|");
             ~
             Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
RegExp("|a");
`,
			snapshot: `
RegExp("|a");
        ~
        Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/a|b||c/;
`,
			snapshot: `
/a|b||c/;
     ~
     Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(a|b|)/;
`,
			snapshot: `
/(a|b|)/;
     ~
     Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(?:|a|b)/;
`,
			snapshot: `
/(?:|a|b)/;
    ~
    Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/|||||/;
`,
			snapshot: `
/|||||/;
 ~
 Empty alternative in regular expression may be a mistake.
  ~
  Empty alternative in regular expression may be a mistake.
   ~
   Empty alternative in regular expression may be a mistake.
    ~
    Empty alternative in regular expression may be a mistake.
     ~
     Empty alternative in regular expression may be a mistake.
     ~
     Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(?:\\|\\|||\\|)/;
`,
			snapshot: `
/(?:\\|\\|||\\|)/;
         ~
         Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(?<name>a|b|)/;
`,
			snapshot: `
/(?<name>a|b|)/;
            ~
            Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(?:a|b|)f/;
`,
			snapshot: `
/(?:a|b|)f/;
       ~
       Empty alternative in regular expression may be a mistake.
`,
		},
		{
			code: `
/(?:a|b|)+f/;
`,
			snapshot: `
/(?:a|b|)+f/;
       ~
       Empty alternative in regular expression may be a mistake.
`,
		},
	],
	valid: [
		`/abc/;`,
		`/a|b/;`,
		`/a|b|c/;`,
		`/(a|b)/;`,
		`/(?:a|b)/;`,
		`/(a|b|c)/;`,
		`/a*/;`,
		`/a?/;`,
		`new RegExp("a|b");`,
		`RegExp("abc");`,
		`new RegExp(variable);`,
		`/[|]/;`,
		`/[a|b]/;`,
		`/()/;`,
		`/(?:)/;`,
		`/(?=)/;`,
		`/a*|b+/;`,
	],
});
