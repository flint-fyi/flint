import rule from "./regexEscapeBackspaces.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\b]/;
`,
			snapshot: `
/[\\b]/;
  ~~
  Use \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/a[\b]b/;
`,
			snapshot: `
/a[\\b]b/;
   ~~
   Use \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/[\b\t]/;
`,
			snapshot: `
/[\\b\\t]/;
  ~~
  Use \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/[a\b]/;
`,
			snapshot: `
/[a\\b]/;
   ~~
   Use \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/[\ba]/;
`,
			snapshot: `
/[\\ba]/;
  ~~
  Use \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: `
new RegExp("[\\\\b]");
`,
			snapshot: `
new RegExp("[\\\\b]");
             ~~
             Use \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
	],
	valid: [
		String.raw`/\b/;`,
		String.raw`/a\b/;`,
		String.raw`/\ba/;`,
		String.raw`/\bword\b/;`,
		String.raw`/[\u0008]/;`,
		String.raw`/[a]/;`,
		String.raw`/[abc]/;`,
		`new RegExp("\\\\b");`,
		`new RegExp(variable);`,
		String.raw`/[\t]/;`,
		String.raw`/[\n]/;`,
	],
});
