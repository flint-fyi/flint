import rule from "./regexUnnecessaryReferentialBackreferences.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/(a)?b\1/;
`,
			snapshot: `
/(a)?b\\1/;
      ~~
      Ensure capturing group is always matched before backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/(a)*\1/;
`,
			snapshot: `
/(a)*\\1/;
     ~~
     Ensure capturing group is always matched before backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/(?:(a)|b)\1/;
`,
			snapshot: `
/(?:(a)|b)\\1/;
          ~~
          Ensure capturing group is always matched before backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/(?:(a)|b)+\1/;
`,
			snapshot: `
/(?:(a)|b)+\\1/;
           ~~
           Ensure capturing group is always matched before backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/((a)|c)+b\2/;
`,
			snapshot: `
/((a)|c)+b\\2/;
          ~~
          Ensure capturing group is always matched before backreference \`\\2\`.
`,
		},
		{
			code: String.raw`
new RegExp("(a)?\\1");
`,
			snapshot: `
new RegExp("(a)?\\\\1");
                ~~
                Ensure capturing group is always matched before backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/(a){0,5}b\1/;
`,
			snapshot: `
/(a){0,5}b\\1/;
          ~~
          Ensure capturing group is always matched before backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/(?:(a)b)*\1/;
`,
			snapshot: `
/(?:(a)b)*\\1/;
          ~~
          Ensure capturing group is always matched before backreference \`\\1\`.
`,
		},
	],
	valid: [
		String.raw`/(a)\1/;`,
		String.raw`/(a+)b\1/;`,
		String.raw`/(a)+\1/;`,
		String.raw`/(?=(a))\1/;`,
		String.raw`/(a)(b)\1\2/;`,
		String.raw`/()\1/;`,
		String.raw`/(a?)\1/;`,
		`RegExp(variable);`,
	],
});
