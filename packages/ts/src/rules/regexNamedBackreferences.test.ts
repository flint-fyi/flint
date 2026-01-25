import rule from "./regexNamedBackreferences.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/(?<name>a)\1/;
`,
			output: String.raw`
/(?<name>a)\k<name>/;
`,
			snapshot: `
/(?<name>a)\\1/;
           ~~
           Prefer named backreference \`\\k<name>\` over numeric backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/(?<name>a)\1/v;
`,
			output: String.raw`
/(?<name>a)\k<name>/v;
`,
			snapshot: `
/(?<name>a)\\1/v;
           ~~
           Prefer named backreference \`\\k<name>\` over numeric backreference \`\\1\`.
`,
		},
		{
			code: String.raw`
/(?<first>a)(?<second>b)\1\2/;
`,
			output: String.raw`
/(?<first>a)(?<second>b)\k<first>\k<second>/;
`,
			snapshot: `
/(?<first>a)(?<second>b)\\1\\2/;
                        ~~
                        Prefer named backreference \`\\k<first>\` over numeric backreference \`\\1\`.
                          ~~
                          Prefer named backreference \`\\k<second>\` over numeric backreference \`\\2\`.
`,
		},
		{
			code: String.raw`
/(?<word>\w+)\s+\1/;
`,
			output: String.raw`
/(?<word>\w+)\s+\k<word>/;
`,
			snapshot: `
/(?<word>\\w+)\\s+\\1/;
                ~~
                Prefer named backreference \`\\k<word>\` over numeric backreference \`\\1\`.
`,
		},
	],
	valid: [
		String.raw`/(a)\1/`,
		String.raw`/(?<name>a)\k<name>/`,
		String.raw`/(a)\1 (?<name>a)\k<name>/`,
		String.raw`/(?<a>x)(?<b>y)\k<a>\k<b>/`,
	],
});
