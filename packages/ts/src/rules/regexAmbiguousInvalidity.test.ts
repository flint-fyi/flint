import rule from "./regexAmbiguousInvalidity.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const re = /\\1/;
`,
			snapshot: `
const re = /\\1/;
            ~~
            Octal escape \`\\1\` is ambiguous; use a hexadecimal escape instead.
`,
		},
		{
			code: `
const re = /\\12/;
`,
			snapshot: `
const re = /\\12/;
            ~~~
            Octal escape \`\\12\` is ambiguous; use a hexadecimal escape instead.
`,
		},
		{
			code: `
const re = /\\07/;
`,
			snapshot: `
const re = /\\07/;
            ~~~
            Octal escape \`\\07\` is ambiguous; use a hexadecimal escape instead.
`,
		},
		{
			code: `
const re = /\\xG/;
`,
			snapshot: `
const re = /\\xG/;
            ~~
            Incomplete \\x escape sequence.
`,
		},
		{
			code: `
const re = /\\x1/;
`,
			snapshot: `
const re = /\\x1/;
            ~~
            Incomplete \\x escape sequence.
`,
		},
		{
			code: `
const re = /\\uGGGG/;
`,
			snapshot: `
const re = /\\uGGGG/;
            ~~
            Incomplete \\u escape sequence.
`,
		},
		{
			code: `
const re = /\\u123/;
`,
			snapshot: `
const re = /\\u123/;
            ~~
            Incomplete \\u escape sequence.
`,
		},
		{
			code: `
const re = /\\c/;
`,
			snapshot: `
const re = /\\c/;
            ~~
            Incomplete \\c escape sequence.
`,
		},
		{
			code: `
const re = /a]/;
`,
			snapshot: `
const re = /a]/;
             ~
             Unescaped character \`]\` should be escaped.
`,
		},
		{
			code: `
const re = /a{/;
`,
			snapshot: `
const re = /a{/;
             ~
             Unescaped character \`{\` should be escaped.
`,
		},
		{
			code: `
const re = /a}/;
`,
			snapshot: `
const re = /a}/;
             ~
             Unescaped character \`}\` should be escaped.
`,
		},
		{
			code: `
const re = /\\q/;
`,
			snapshot: `
const re = /\\q/;
            ~~
            Useless escape \`\\q\`.
`,
		},
		{
			code: `
const re = /\\!/;
`,
			snapshot: `
const re = /\\!/;
            ~~
            Useless escape \`\\!\`.
`,
		},
		{
			code: `
const re = RegExp("\\\\1");
`,
			snapshot: `
const re = RegExp("\\\\1");
                   ~~
                   Octal escape \`\\1\` is ambiguous; use a hexadecimal escape instead.
`,
		},
		{
			code: `
const re = new RegExp("\\\\1");
`,
			snapshot: `
const re = new RegExp("\\\\1");
                       ~~
                       Octal escape \`\\1\` is ambiguous; use a hexadecimal escape instead.
`,
		},
		{
			code: `
const re = RegExp("\\\\x1");
`,
			snapshot: `
const re = RegExp("\\\\x1");
                   ~~
                   Incomplete \\x escape sequence.
`,
		},
		{
			code: `
const re = new RegExp("a]");
`,
			snapshot: `
const re = new RegExp("a]");
                        ~
                        Unescaped character \`]\` should be escaped.
`,
		},
	],
	valid: [
		`const re = /abc/;`,
		`const re = /\\d+/;`,
		`const re = /\\w+/;`,
		`const re = /\\s+/;`,
		`const re = /\\x1F/;`,
		`const re = /\\u0041/;`,
		`const re = /\\cA/;`,
		`const re = /[a-z]/;`,
		`const re = /\\[/;`,
		`const re = /\\]/;`,
		`const re = /\\{/;`,
		`const re = /\\}/;`,
		`const re = /\\./;`,
		`const re = /\\*/;`,
		`const re = /\\+/;`,
		`const re = /\\?/;`,
		`const re = /\\^/;`,
		`const re = /\\$/;`,
		`const re = /\\|/;`,
		`const re = /\\\\/;`,
		`const re = /\\(/;`,
		`const re = /\\)/;`,
		`const re = /\\1/u;`,
		`const re = /\\1/v;`,
		`const re = RegExp("\\\\d+");`,
		`const re = new RegExp("\\\\w+");`,
		`const re = RegExp("\\\\1", "u");`,
		`const re = new RegExp("\\\\1", "v");`,
		`const re = RegExp(pattern);`,
		`const re = new RegExp(getPattern());`,
	],
});
