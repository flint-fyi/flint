import rule from "./regexUnnecessaryNestedQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(?:a?)+/;
`,
			output: `
/a*/;
`,
			snapshot: `
/(?:a?)+/;
 ~~~~~~~
 The nested quantifiers \`(?:a?)+\` can be simplified to \`a*\`.
`,
		},
		{
			code: `
/(?:a+)+/;
`,
			output: `
/a+/;
`,
			snapshot: `
/(?:a+)+/;
 ~~~~~~~
 The nested quantifiers \`(?:a+)+\` can be simplified to \`a+\`.
`,
		},
		{
			code: `
/(?:a+)*/;
`,
			output: `
/a*/;
`,
			snapshot: `
/(?:a+)*/;
 ~~~~~~~
 The nested quantifiers \`(?:a+)*\` can be simplified to \`a*\`.
`,
		},
		{
			code: `
/(?:a?)*/;
`,
			output: `
/a*/;
`,
			snapshot: `
/(?:a?)*/;
 ~~~~~~~
 The nested quantifiers \`(?:a?)*\` can be simplified to \`a*\`.
`,
		},
		{
			code: `
/(?:[a-z]?)+/;
`,
			output: `
/[a-z]*/;
`,
			snapshot: `
/(?:[a-z]?)+/;
 ~~~~~~~~~~~
 The nested quantifiers \`(?:[a-z]?)+\` can be simplified to \`[a-z]*\`.
`,
		},
		{
			code: String.raw`
/(?:\w+)+/;
`,
			output: String.raw`
/\w+/;
`,
			snapshot: `
/(?:\\w+)+/;
 ~~~~~~~~
 The nested quantifiers \`(?:\\w+)+\` can be simplified to \`\\w+\`.
`,
		},
		{
			code: `
/(?:a??)+?/;
`,
			output: `
/a*?/;
`,
			snapshot: `
/(?:a??)+?/;
 ~~~~~~~~~
 The nested quantifiers \`(?:a??)+?\` can be simplified to \`a*?\`.
`,
		},
		{
			code: `
/(?:a+?)*?/;
`,
			output: `
/a*?/;
`,
			snapshot: `
/(?:a+?)*?/;
 ~~~~~~~~~
 The nested quantifiers \`(?:a+?)*?\` can be simplified to \`a*?\`.
`,
		},
		{
			code: `
/(?:a*)+/;
`,
			output: `
/a*/;
`,
			snapshot: `
/(?:a*)+/;
 ~~~~~~~
 The nested quantifiers \`(?:a*)+\` can be simplified to \`a*\`.
`,
		},
		{
			code: `
/(?:a*)*/;
`,
			output: `
/a*/;
`,
			snapshot: `
/(?:a*)*/;
 ~~~~~~~
 The nested quantifiers \`(?:a*)*\` can be simplified to \`a*\`.
`,
		},
		{
			code: `
new RegExp("(?:a?)+");
`,
			output: `
new RegExp("a*");
`,
			snapshot: `
new RegExp("(?:a?)+");
            ~~~~~~~
            The nested quantifiers \`(?:a?)+\` can be simplified to \`a*\`.
`,
		},
		{
			code: `
RegExp("(?:a+)+");
`,
			output: `
RegExp("a+");
`,
			snapshot: `
RegExp("(?:a+)+");
        ~~~~~~~
        The nested quantifiers \`(?:a+)+\` can be simplified to \`a+\`.
`,
		},
	],
	valid: [
		`/(a?)+/;`,
		`/(?:ab?)+/;`,
		`/(?:a)+/;`,
		`/(?:a?)+?/;`,
		`/(?:a??)+/;`,
		String.raw`/(?:a{2})+/;`,
		`RegExp(variable);`,
		`/(?:a|b)+/;`,
		`/(?:a?b)+/;`,
	],
});
