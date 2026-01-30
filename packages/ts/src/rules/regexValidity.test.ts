// spellchecker:disable
import rule from "./regexValidity.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
RegExp("(");
`,
			snapshot: `
RegExp("(");
        ~
        Invalid regular expression pattern.
`,
		},
		{
			code: `
RegExp("[");
`,
			snapshot: `
RegExp("[");
        ~
        Invalid regular expression pattern.
`,
		},
		{
			code: `
new RegExp("\\\\");
`,
			snapshot: `
new RegExp("\\\\");
            ~~
            Invalid regular expression pattern.
`,
		},
		{
			code: `
new RegExp("*");
`,
			snapshot: `
new RegExp("*");
            ~
            Invalid regular expression pattern.
`,
		},
		{
			code: `
RegExp("abc", "q");
`,
			snapshot: `
RegExp("abc", "q");
               ~
               Invalid regular expression flag \`q\`.
`,
		},
		{
			code: `
RegExp("abc", "gg");
`,
			snapshot: `
RegExp("abc", "gg");
                ~
                Duplicate regular expression flag \`g\`.
`,
		},
		{
			code: `
RegExp("abc", "uv");
`,
			snapshot: `
RegExp("abc", "uv");
                ~
                The \`u\` and \`v\` flags cannot be used together.
`,
		},
		{
			code: `
RegExp("abc", "vu");
`,
			snapshot: `
RegExp("abc", "vu");
                ~
                The \`u\` and \`v\` flags cannot be used together.
`,
		},
		{
			code: `
/(/;
`,
			snapshot: `
/(/;
 ~
 Invalid regular expression pattern.
`,
		},
		{
			code: `
/abc/gg;
`,
			snapshot: `
/abc/gg;
      ~
      Duplicate regular expression flag \`g\`.
`,
		},
		{
			code: `
/abc/uv;
`,
			snapshot: `
/abc/uv;
      ~
      The \`u\` and \`v\` flags cannot be used together.
`,
		},
		{
			code: `
RegExp("abc", "gqx");
`,
			snapshot: `
RegExp("abc", "gqx");
                ~
                Invalid regular expression flag \`q\`.
                 ~
                 Invalid regular expression flag \`x\`.
`,
		},
	],
	valid: [
		`RegExp("abc");`,
		`RegExp("abc", "gi");`,
		`new RegExp("\\\\d+");`,
		`new RegExp("abc", "dgimsuy");`,
		`RegExp(patternVar);`,
		`RegExp("abc", flagsVar);`,
		`/abc/;`,
		`/abc/gi;`,
		`/\\d+/;`,
		`/abc/dgimsuy;`,
	],
});
