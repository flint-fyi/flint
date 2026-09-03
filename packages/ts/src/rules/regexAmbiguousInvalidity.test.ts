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
const re = /\c;/;
`,
			snapshot: `
const re = /\\c;/;
            ~
            Invalid or incomplete control escape sequence.
`,
		},
		{
			code: String.raw`
const re = /\p/;
`,
			snapshot: `
const re = /\\p/;
            ~~
            Invalid property escape sequence '\\p'.
`,
		},
		{
			code: String.raw`
const re = /\; \_ \a \- \'/;
`,
			snapshot: `
const re = /\\; \\_ \\a \\- \\'/;
            ~~
            Useless escape '\\;'.
               ~~
               Useless escape '\\_'.
                  ~~
                  Useless escape '\\a'.
                     ~~
                     Useless escape '\\-'.
                        ~~
                        Useless escape '\\''.
`,
		},
		{
			code: String.raw`
const re = /[\; \_ \a \']/;
`,
			snapshot: `
const re = /[\\; \\_ \\a \\']/;
             ~~
             Useless escape '\\;'.
                ~~
                Useless escape '\\_'.
                   ~~
                   Useless escape '\\a'.
                      ~~
                      Useless escape '\\''.
`,
		},
		{
			code: String.raw`
const re = /\q/;
`,
			snapshot: `
const re = /\\q/;
            ~~
            Useless escape '\\q'.
`,
		},
		{
			code: String.raw`
const re = /\!/;
`,
			snapshot: `
const re = /\\!/;
            ~~
            Useless escape '\\!'.
`,
		},
		{
			code: String.raw`
const re = /[\w-a]/;
`,
			snapshot: `
const re = /[\\w-a]/;
             ~~
             Invalid character class range. A character set cannot be the minimum or maximum of a character class range.
`,
		},
		{
			code: String.raw`
const re = /[a-\w]/;
`,
			snapshot: `
const re = /[a-\\w]/;
               ~~
               Invalid character class range. A character set cannot be the minimum or maximum of a character class range.
`,
		},
		{
			code: String.raw`
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
const re = RegExp("\\1");
`,
			snapshot: `
const re = RegExp("\\\\1");
                   ~~
                   Invalid legacy octal escape sequence '\\1'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = new RegExp("\\1");
`,
			snapshot: `
const re = new RegExp("\\\\1");
                       ~~
                       Invalid legacy octal escape sequence '\\1'. Use a hexadecimal escape instead.
`,
		},
		{
			code: String.raw`
const re = RegExp("\\x1");
`,
			snapshot: `
const re = RegExp("\\\\x1");
                   ~~
                   Incomplete escape sequence '\\x'.
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
		String.raw`const re = /[A--B]/v;`,
		String.raw`const re = RegExp("\\d+");`,
		String.raw`const re = new RegExp("\\w+");`,
		String.raw`const re = RegExp("\\1", "u");`,
		String.raw`const re = new RegExp("\\1", "v");`,
		`
declare const pattern: string;

const re = RegExp(pattern);`,
		`
declare function getPattern(): string;

const re = new RegExp(getPattern());`,
	],
});
