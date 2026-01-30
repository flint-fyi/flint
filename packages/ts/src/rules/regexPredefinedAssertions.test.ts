import rule from "./regexPredefinedAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/a(?=\w)b/;
`,
			output: String.raw`
/a\Bb/;
`,
			snapshot: `
/a(?=\\w)b/;
  ~~~~~~
  Prefer the predefined assertion \`\\B\` over the verbose lookaround \`(?=\\w)\`.
`,
		},
		{
			code: String.raw`
/a(?!\w)b/;
`,
			output: String.raw`
/a\bb/;
`,
			snapshot: `
/a(?!\\w)b/;
  ~~~~~~
  Prefer the predefined assertion \`\\b\` over the verbose lookaround \`(?!\\w)\`.
`,
		},
		{
			code: String.raw`
/a(?<=\w)b/;
`,
			output: String.raw`
/a\Bb/;
`,
			snapshot: `
/a(?<=\\w)b/;
  ~~~~~~~
  Prefer the predefined assertion \`\\B\` over the verbose lookaround \`(?<=\\w)\`.
`,
		},
		{
			code: String.raw`
/a(?<!\w)b/;
`,
			output: String.raw`
/a\bb/;
`,
			snapshot: `
/a(?<!\\w)b/;
  ~~~~~~~
  Prefer the predefined assertion \`\\b\` over the verbose lookaround \`(?<!\\w)\`.
`,
		},
		{
			code: String.raw`
/abc(?!.)/;
`,
			output: String.raw`
/abc$/;
`,
			snapshot: `
/abc(?!.)/;
    ~~~~~
    Prefer the predefined assertion \`$\` over the verbose lookaround \`(?!.)\`.
`,
		},
		{
			code: String.raw`
/(?<!.)abc/;
`,
			output: String.raw`
/^abc/;
`,
			snapshot: `
/(?<!.)abc/;
 ~~~~~~
 Prefer the predefined assertion \`^\` over the verbose lookaround \`(?<!.)\`.
`,
		},
	],
	valid: [
		String.raw`/a\bb/;`,
		String.raw`/a\Bb/;`,
		String.raw`/(?=\w\w)/;`,
		String.raw`/(?=\d)/;`,
		String.raw`/(?=.)/;`,
		String.raw`/a(?!.)b/;`,
		String.raw`/a(?<!.)b/;`,
		String.raw`/(?<!.)word|other/;`,
	],
});
