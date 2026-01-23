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
  Prefer the clearer \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/a[\b]b/;
`,
			snapshot: `
/a[\\b]b/;
   ~~
   Prefer the clearer \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/[\b\t]/;
`,
			snapshot: `
/[\\b\\t]/;
  ~~
  Prefer the clearer \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/[a\b]/;
`,
			snapshot: `
/[a\\b]/;
   ~~
   Prefer the clearer \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: String.raw`
/[\ba]/;
`,
			snapshot: `
/[\\ba]/;
  ~~
  Prefer the clearer \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
		{
			code: `
new RegExp("[\\\\b]");
`,
			snapshot: `
new RegExp("[\\\\b]");
             ~~
             Prefer the clearer \`\\u0008\` instead of \`[\\b]\` for backspace character.
`,
		},
	],
	valid: [
		`new RegExp("\\\\b");`,
		`new RegExp(variable);`,
		String.raw`/[\n]/;`,
		String.raw`/[\t]/;`,
		String.raw`/[\u0008]/;`,
		String.raw`/[a]/;`,
		String.raw`/[abc]/;`,
		String.raw`/\b/;`,
		String.raw`/\ba/;`,
		String.raw`/\bword\b/;`,
		String.raw`/a\b/;`,
	],
});
