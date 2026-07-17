// flint-disable-file ts/escapeSequenceCasing
import rule from "./regexInvisibleCharacters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/\t/;
`,
			output: String.raw`
/\x09/;
`,
			snapshot: `
/\t/;
 ~
 Prefer the more clear '\\x09' instead of this invisible character.
`,
		},
		{
			code: `
/\u{A0}/;
`,
			output: String.raw`
/\xA0/;
`,
			snapshot: `
/\u{A0}/;
 ~
 Prefer the more clear '\\xA0' instead of this invisible character.
`,
		},
		{
			code: `
/\u{200B}/;
`,
			output: String.raw`
/\u200B/;
`,
			snapshot: `
/\u{200B}/;
 ~
 Prefer the more clear '\\u200B' instead of this invisible character.
`,
		},
		{
			code: `
/\u{200B}/u;
`,
			output: String.raw`
/\u{200B}/u;
`,
			snapshot: `
/\u{200B}/u;
 ~
 Prefer the more clear '\\u{200B}' instead of this invisible character.
`,
		},
		{
			code: `
/[\t]/;
`,
			output: String.raw`
/[\x09]/;
`,
			snapshot: `
/[\t]/;
  ~
  Prefer the more clear '\\x09' instead of this invisible character.
`,
		},
		{
			code: `
/[\t\u{A0}]/;
`,
			output: String.raw`
/[\x09\xA0]/;
`,
			snapshot: `
/[\t\u{A0}]/;
  ~
  Prefer the more clear '\\x09' instead of this invisible character.
   ~
   Prefer the more clear '\\xA0' instead of this invisible character.
`,
		},
		{
			code: `
/\u{1680}/;
`,
			output: String.raw`
/\u1680/;
`,
			snapshot: `
/\u{1680}/;
 ~
 Prefer the more clear '\\u1680' instead of this invisible character.
`,
		},
		{
			code: `
/\u{180E}/;
`,
			output: String.raw`
/\u180E/;
`,
			snapshot: `
/\u{180E}/;
 ~
 Prefer the more clear '\\u180E' instead of this invisible character.
`,
		},
		{
			code: `
/\u{2000}\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}/;
`,
			output: String.raw`
/\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A/;
`,
			snapshot: `
/\u{2000}\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}/;
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
/\u{202F}\u{205F}\u{3000}/;
`,
			output: String.raw`
/\u202F\u205F\u3000/;
`,
			snapshot: `
/\u{202F}\u{205F}\u{3000}/;
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
/\u{FEFF}/;
`,
			output: String.raw`
/\uFEFF/;
`,
			snapshot: `
/\u{FEFF}/;
 ~
 Prefer the more clear '\\uFEFF' instead of this invisible character.
`,
		},
		{
			code: `
/\u{85}/;
`,
			output: String.raw`
/\x85/;
`,
			snapshot: `
/\u{85}/;
 ~
 Prefer the more clear '\\x85' instead of this invisible character.
`,
		},
		{
			code: `
/\u{200C}/;
`,
			output: String.raw`
/\u200C/;
`,
			snapshot: `
/\u{200C}/;
 ~
 Prefer the more clear '\\u200C' instead of this invisible character.
`,
		},
		{
			code: `
/\u{200D}/;
`,
			output: String.raw`
/\u200D/;
`,
			snapshot: `
/\u{200D}/;
 ~
 Prefer the more clear '\\u200D' instead of this invisible character.
`,
		},
		{
			code: `
/\u{200E}/;
`,
			output: String.raw`
/\u200E/;
`,
			snapshot: `
/\u{200E}/;
 ~
 Prefer the more clear '\\u200E' instead of this invisible character.
`,
		},
		{
			code: `
/\u{200F}/;
`,
			output: String.raw`
/\u200F/;
`,
			snapshot: `
/\u{200F}/;
 ~
 Prefer the more clear '\\u200F' instead of this invisible character.
`,
		},
		{
			code: `
/\u{2800}/;
`,
			output: String.raw`
/\u2800/;
`,
			snapshot: `
/\u{2800}/;
 ~
 Prefer the more clear '\\u2800' instead of this invisible character.
`,
		},
		{
			code: `
new RegExp('\t');
`,
			output: String.raw`
new RegExp('\x09');
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
			output: String.raw`
/[\q{\x09}]/v;
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
		String.raw`
const a = '' + '\t';
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
