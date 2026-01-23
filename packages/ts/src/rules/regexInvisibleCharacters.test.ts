// flint-disable-file escapeSequenceCasing
import rule from "./regexInvisibleCharacters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/\t/;
`,
			output: `
/\\x09/;
`,
			snapshot: `
/\t/;
 ~
 Prefer the more clear '\\x09' instead of this invisible character.
`,
		},
		{
			code: `
/\u00a0/;
`,
			output: `
/\\xA0/;
`,
			snapshot: `
/\u00a0/;
 ~
 Prefer the more clear '\\xA0' instead of this invisible character.
`,
		},
		{
			code: `
/\u200b/;
`,
			output: `
/\\u200B/;
`,
			snapshot: `
/\u200b/;
 ~
 Prefer the more clear '\\u200B' instead of this invisible character.
`,
		},
		{
			code: `
/\u200b/u;
`,
			output: `
/\\u{200B}/u;
`,
			snapshot: `
/\u200b/u;
 ~
 Prefer the more clear '\\u{200B}' instead of this invisible character.
`,
		},
		{
			code: `
/[\t]/;
`,
			output: `
/[\\x09]/;
`,
			snapshot: `
/[\t]/;
  ~
  Prefer the more clear '\\x09' instead of this invisible character.
`,
		},
		{
			code: `
/[\t\u00a0]/;
`,
			output: `
/[\\x09\\xA0]/;
`,
			snapshot: `
/[\t\u00a0]/;
  ~
  Prefer the more clear '\\x09' instead of this invisible character.
   ~
   Prefer the more clear '\\xA0' instead of this invisible character.
`,
		},
		{
			code: `
/\u1680/;
`,
			output: `
/\\u1680/;
`,
			snapshot: `
/\u1680/;
 ~
 Prefer the more clear '\\u1680' instead of this invisible character.
`,
		},
		{
			code: `
/\u180e/;
`,
			output: `
/\\u180E/;
`,
			snapshot: `
/\u180e/;
 ~
 Prefer the more clear '\\u180E' instead of this invisible character.
`,
		},
		{
			code: `
/\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a/;
`,
			output: `
/\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A/;
`,
			snapshot: `
/\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a/;
 ~
 Prefer the more clear '\\u2000' instead of this invisible character.
  ~
  Prefer the more clear '\\u2001' instead of this invisible character.
   ~
   Prefer the more clear '\\u2002' instead of this invisible character.
    ~
    Prefer the more clear '\\u2003' instead of this invisible character.
     ~
     Prefer the more clear '\\u2004' instead of this invisible character.
      ~
      Prefer the more clear '\\u2005' instead of this invisible character.
       ~
       Prefer the more clear '\\u2006' instead of this invisible character.
        ~
        Prefer the more clear '\\u2007' instead of this invisible character.
         ~
         Prefer the more clear '\\u2008' instead of this invisible character.
          ~
          Prefer the more clear '\\u2009' instead of this invisible character.
           ~
           Prefer the more clear '\\u200A' instead of this invisible character.
`,
		},
		{
			code: `
/\u202f\u205f\u3000/;
`,
			output: `
/\\u202F\\u205F\\u3000/;
`,
			snapshot: `
/\u202f\u205f\u3000/;
 ~
 Prefer the more clear '\\u202F' instead of this invisible character.
  ~
  Prefer the more clear '\\u205F' instead of this invisible character.
   ~
   Prefer the more clear '\\u3000' instead of this invisible character.
`,
		},
		{
			code: `
/\ufeff/;
`,
			output: `
/\\uFEFF/;
`,
			snapshot: `
/\ufeff/;
 ~
 Prefer the more clear '\\uFEFF' instead of this invisible character.
`,
		},
		{
			code: `
/\u0085/;
`,
			output: `
/\\x85/;
`,
			snapshot: `
/\u0085/;
 ~
 Prefer the more clear '\\x85' instead of this invisible character.
`,
		},
		{
			code: `
/\u200c/;
`,
			output: `
/\\u200C/;
`,
			snapshot: `
/\u200c/;
 ~
 Prefer the more clear '\\u200C' instead of this invisible character.
`,
		},
		{
			code: `
/\u200d/;
`,
			output: `
/\\u200D/;
`,
			snapshot: `
/\u200d/;
 ~
 Prefer the more clear '\\u200D' instead of this invisible character.
`,
		},
		{
			code: `
/\u200e/;
`,
			output: `
/\\u200E/;
`,
			snapshot: `
/\u200e/;
 ~
 Prefer the more clear '\\u200E' instead of this invisible character.
`,
		},
		{
			code: `
/\u200f/;
`,
			output: `
/\\u200F/;
`,
			snapshot: `
/\u200f/;
 ~
 Prefer the more clear '\\u200F' instead of this invisible character.
`,
		},
		{
			code: `
/\u2800/;
`,
			output: `
/\\u2800/;
`,
			snapshot: `
/\u2800/;
 ~
 Prefer the more clear '\\u2800' instead of this invisible character.
`,
		},
		{
			code: `
new RegExp('\t');
`,
			output: `
new RegExp('\\x09');
`,
			snapshot: `
new RegExp('\t');
            ~
            Prefer the more clear '\\x09' instead of this invisible character.
`,
		},
		{
			code: `
/[\\q{\t}]/v;
`,
			output: `
/[\\q{\\x09}]/v;
`,
			snapshot: `
/[\\q{\t}]/v;
     ~
     Prefer the more clear '\\x09' instead of this invisible character.
`,
		},
	],
	valid: [
		`/ /;`,
		`/[ ]/;`,
		`/[a]/;`,
		`/a/;`,
		`/abc/;`,
		`
const a = '' + '\\t';
new RegExp(a);
`,
		`new RegExp(' ');`,
		`new RegExp('[ ]');`,
		`new RegExp('a');`,
		String.raw`/\n/;`,
		String.raw`/\r/;`,
		String.raw`/\t/;`,
		String.raw`/\u00A0/;`,
		String.raw`/\u200B/;`,
		String.raw`/\x09/;`,
		String.raw`/\x0A/;`,
		String.raw`/\x0D/;`,
		String.raw`new RegExp('\\t');`,
		String.raw`/[\q{\t}]/v;`,
	],
});
