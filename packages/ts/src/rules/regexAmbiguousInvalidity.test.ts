// flint-disable-file ts/escapeSequenceCasing
import rule from "./regexAmbiguousInvalidity.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const re = /]/;
`,
			snapshot: `
const re = /]/;
            ~
            Unescaped source character ']' should be escaped.
`,
		},
		{
			code: `
const re = /{/;
`,
			snapshot: `
const re = /{/;
            ~
            Unescaped source character '{' should be escaped.
`,
		},
		{
			code: `
const re = /}/;
`,
			snapshot: `
const re = /}/;
            ~
            Unescaped source character '}' should be escaped.
`,
		},
		{
			code: String.raw`
const re = /\u{42}/;
`,
			snapshot: String.raw`
const re = /\u{42}/;
            ~~
            Incomplete escape sequence '\u'.
`,
		},
		{
			code: String.raw`
const re = /\u000;/;
`,
			snapshot: String.raw`
const re = /\u000;/;
            ~~
            Incomplete escape sequence '\u'.
`,
		},
		{
			code: String.raw`
const re = /\x4/;
`,
			snapshot: String.raw`
const re = /\x4/;
            ~~
            Incomplete escape sequence '\x'.
`,
		},
		{
			code: String.raw`
const re = /\c;/;
`,
			snapshot: String.raw`
const re = /\c;/;
            ~
            Invalid or incomplete control escape sequence.
`,
		},
		{
			code: String.raw`
const re = /\p/;
`,
			snapshot: String.raw`
const re = /\p/;
            ~~
            Invalid property escape sequence '\p'.
`,
		},
		{
			code: String.raw`
const re = /\p{H}/;
`,
			snapshot: String.raw`
const re = /\p{H}/;
            ~~
            Invalid property escape sequence '\p'.
              ~
              Unescaped source character '{' should be escaped.
                ~
                Unescaped source character '}' should be escaped.
`,
		},
		{
			code: String.raw`
const re = /\012/;
`,
			snapshot: String.raw`
const re = /\012/;
            ~~~~
            Invalid legacy octal escape sequence '\012'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = /\12/;
`,
			snapshot: String.raw`
const re = /\12/;
            ~~~
            Invalid legacy octal escape sequence '\12'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = /\1/;
`,
			snapshot: String.raw`
const re = /\1/;
            ~~
            Invalid legacy octal escape sequence '\1'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = /\07/;
`,
			snapshot: String.raw`
const re = /\07/;
            ~~~
            Invalid legacy octal escape sequence '\07'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = /\k<foo/;
`,
			snapshot: String.raw`
const re = /\k<foo/;
            ~~
            Incomplete backreference '\k'.
`,
		},
		{
			code: String.raw`
const re = /\k<foo>/;
`,
			snapshot: String.raw`
const re = /\k<foo>/;
            ~~
            Incomplete backreference '\k'.
`,
		},
		{
			code: String.raw`
const re = /\; \_ \a \- \'/;
`,
			snapshot: String.raw`
const re = /\; \_ \a \- \'/;
            ~~
            Useless escape '\;'.
               ~~
               Useless escape '\_'.
                  ~~
                  Useless escape '\a'.
                     ~~
                     Useless escape '\-'.
                        ~~
                        Useless escape '\''.
`,
		},
		{
			code: String.raw`
const re = /[\; \_ \a \']/;
`,
			snapshot: String.raw`
const re = /[\; \_ \a \']/;
             ~~
             Useless escape '\;'.
                ~~
                Useless escape '\_'.
                   ~~
                   Useless escape '\a'.
                      ~~
                      Useless escape '\''.
`,
		},
		{
			code: String.raw`
const re = /\q/;
`,
			snapshot: String.raw`
const re = /\q/;
            ~~
            Useless escape '\q'.
`,
		},
		{
			code: String.raw`
const re = /\!/;
`,
			snapshot: String.raw`
const re = /\!/;
            ~~
            Useless escape '\!'.
`,
		},
		{
			code: String.raw`
const re = /[\w-a]/;
`,
			snapshot: String.raw`
const re = /[\w-a]/;
             ~~
             Invalid character class range. A character set cannot be the minimum or maximum of a character class range.
`,
		},
		{
			code: String.raw`
const re = /[a-\w]/;
`,
			snapshot: String.raw`
const re = /[a-\w]/;
               ~~
               Invalid character class range. A character set cannot be the minimum or maximum of a character class range.
`,
		},
		{
			code: `
const re = /(?!a)+/;
`,
			snapshot: `
const re = /(?!a)+/;
            ~~~~~~
            Assertions are not allowed to be quantified directly.
`,
		},
		{
			code: String.raw`
const re = /\b+/;
`,
			snapshot: String.raw`
const re = /\b+/;
            ~~~
            Invalid regular expression: /\b+/: Nothing to repeat.
`,
		},
		{
			code: String.raw`
const re = RegExp("\\1");
`,
			snapshot: String.raw`
const re = RegExp("\\1");
                   ~~
                   Invalid legacy octal escape sequence '\1'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = new RegExp("\\1");
`,
			snapshot: String.raw`
const re = new RegExp("\\1");
                       ~~
                       Invalid legacy octal escape sequence '\1'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = RegExp("\\x1");
`,
			snapshot: String.raw`
const re = RegExp("\\x1");
                   ~~
                   Incomplete escape sequence '\x'.
`,
		},
		{
			code: `
const re = new RegExp("a]");
`,
			snapshot: `
const re = new RegExp("a]");
                        ~
                        Unescaped source character ']' should be escaped.
`,
		},
	],
	valid: [
		`const re = /abc/;`,
		`const re = /regexp/;`,
		String.raw`const re = /\{\}\]/;`,
		String.raw`const re = /[-\w-]/;`,
		String.raw`const re = /[a-b-\w]/;`,
		String.raw`const re = /\0/;`,
		String.raw`const re = /()\1/;`,
		String.raw`const re = /(?<foo>)\k<foo>/;`,
		String.raw`const re = /\p{L}/u;`,
		String.raw`const re = / \( \) \[ \] \{ \} \| \* \+ \? \^ \$ \\ \/ \./;`,
		String.raw`const re = /[\( \) \[ \] \{ \} \| \* \+ \? \^ \$ \\ \/ \. \-]/;`,
		String.raw`const re = /\d+/;`,
		String.raw`const re = /\w+/;`,
		String.raw`const re = /\s+/;`,
		String.raw`const re = /\x1F/;`,
		String.raw`const re = /\u0041/;`,
		String.raw`const re = /\u000f/;`,
		String.raw`const re = /\x000f/;`,
		String.raw`const re = /\cA/;`,
		`const re = /[a-z]/;`,
		String.raw`const re = /\[/;`,
		String.raw`const re = /\]/;`,
		String.raw`const re = /\{/;`,
		String.raw`const re = /\}/;`,
		String.raw`const re = /\./;`,
		String.raw`const re = /\*/;`,
		String.raw`const re = /\+/;`,
		String.raw`const re = /\?/;`,
		String.raw`const re = /\^/;`,
		String.raw`const re = /\$/;`,
		String.raw`const re = /\|/;`,
		String.raw`const re = /\\/;`,
		String.raw`const re = /\(/;`,
		String.raw`const re = /\)/;`,
		String.raw`const re = /\1/u;`,
		String.raw`const re = /\1/v;`,
		"const re = /[A--B]/v;",
		String.raw`const re = RegExp("\\d+");`,
		String.raw`const re = new RegExp("\\w+");`,
		String.raw`const re = RegExp("\\1", "u");`,
		String.raw`const re = new RegExp("\\1", "v");`,
		`const re = RegExp(pattern);`,
		`const re = new RegExp(getPattern());`,
	],
});
