import rule from "./regexOctalEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
new RegExp("\\07");
`,
			snapshot: String.raw`
new RegExp("\\07");
            ~~~
            Octal escape sequence '\07' can be confused with backreferences.
`,
		},
		{
			code: String.raw`
new RegExp("\\077");
`,
			snapshot: String.raw`
new RegExp("\\077");
            ~~~~
            Octal escape sequence '\077' can be confused with backreferences.
`,
		},
		{
			code: String.raw`
new RegExp("[\\077]");
`,
			snapshot: String.raw`
new RegExp("[\\077]");
             ~~~~
             Octal escape sequence '\077' can be confused with backreferences.
`,
		},
		{
			code: String.raw`
new RegExp("\\7");
`,
			snapshot: String.raw`
new RegExp("\\7");
            ~~
            Octal escape sequence '\7' can be confused with backreferences.
`,
		},
		{
			code: String.raw`
new RegExp("\\1\\2");
`,
			snapshot: String.raw`
new RegExp("\\1\\2");
            ~~
            Octal escape sequence '\1' can be confused with backreferences.
              ~~
              Octal escape sequence '\2' can be confused with backreferences.
`,
		},
		{
			code: String.raw`
new RegExp("()\\1\\2");
`,
			snapshot: String.raw`
new RegExp("()\\1\\2");
                ~~
                Octal escape sequence '\2' can be confused with backreferences.
`,
		},
		{
			code: String.raw`
new RegExp("\\07");
`,
			snapshot: String.raw`
new RegExp("\\07");
            ~~~
            Octal escape sequence '\07' can be confused with backreferences.
`,
		},
	],
	valid: [
		String.raw`/\0/;`,
		String.raw`new RegExp("[\\7]");`,
		String.raw`new RegExp("[\\1-\\4]");`,
		String.raw`/()\1/;`,
		String.raw`/()()\1\2/;`,
		String.raw`new RegExp("\\0");`,
		`declare const variable: string; RegExp(variable);`,
	],
});
