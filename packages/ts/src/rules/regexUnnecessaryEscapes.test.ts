import rule from "./regexUnnecessaryEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\a/;
`,
			snapshot: `
/\\a/;
 ~~
 This escape sequence \`\\a\` is unnecessary.
`,
		},
		{
			code: String.raw`
/\=/;
`,
			snapshot: `
/\\=/;
 ~~
 This escape sequence \`\\=\` is unnecessary.
`,
		},
		{
			code: String.raw`
/\#/;
`,
			snapshot: `
/\\#/;
 ~~
 This escape sequence \`\\#\` is unnecessary.
`,
		},
		{
			code: String.raw`
/[a\^b]/;
`,
			snapshot: `
/[a\\^b]/;
   ~~
   This escape sequence \`\\^\` is unnecessary.
`,
		},
		{
			code: String.raw`
/[\-ab]/;
`,
			snapshot: `
/[\\-ab]/;
  ~~
  This escape sequence \`\\-\` is unnecessary.
`,
		},
		{
			code: String.raw`
/[ab\-]/;
`,
			snapshot: `
/[ab\\-]/;
    ~~
    This escape sequence \`\\-\` is unnecessary.
`,
		},
		{
			code: String.raw`
/[\!]/;
`,
			snapshot: `
/[\\!]/;
  ~~
  This escape sequence \`\\!\` is unnecessary.
`,
		},
		{
			code: String.raw`
new RegExp("\\a");
`,
			snapshot: `
new RegExp("\\\\a");
            ~~
            This escape sequence \`\\a\` is unnecessary.
`,
		},
		{
			code: String.raw`
new RegExp("[a\\^b]");
`,
			snapshot: `
new RegExp("[a\\\\^b]");
              ~~
              This escape sequence \`\\^\` is unnecessary.
`,
		},
		{
			code: String.raw`
RegExp("\\#");
`,
			snapshot: `
RegExp("\\\\#");
        ~~
        This escape sequence \`\\#\` is unnecessary.
`,
		},
		{
			code: String.raw`
/[^\^a]/;
`,
			snapshot: `
/[^\\^a]/;
   ~~
   This escape sequence \`\\^\` is unnecessary.
`,
		},
	],
	valid: [
		String.raw`/\./;`,
		String.raw`/\*/;`,
		String.raw`/\^/;`,
		String.raw`/\$/;`,
		String.raw`/\+/;`,
		String.raw`/\?/;`,
		String.raw`/\[/;`,
		String.raw`/\]/;`,
		String.raw`/\{/;`,
		String.raw`/\}/;`,
		String.raw`/\|/;`,
		String.raw`/\(/;`,
		String.raw`/\)/;`,
		String.raw`/\//;`,
		String.raw`/\\/;`,
		String.raw`/[\]]/;`,
		String.raw`/[a\-b]/;`,
		String.raw`/[\^ab]/;`,
		String.raw`/[\\]/;`,
		String.raw`/\n/;`,
		String.raw`/\d/;`,
		String.raw`/\w/;`,
		String.raw`/\s/;`,
		String.raw`/\t/;`,
		String.raw`/\r/;`,
		String.raw`/\x41/;`,
		String.raw`/\u0041/;`,
		`new RegExp(variable);`,
		String.raw`new RegExp("\\.");`,
		String.raw`new RegExp("[a\\-b]");`,
	],
});
