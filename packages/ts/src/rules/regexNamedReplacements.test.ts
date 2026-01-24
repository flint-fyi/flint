import rule from "./regexNamedReplacements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
"str".replace(/a(?<name>b)c/, "_$1_");
`,
			output: String.raw`
"str".replace(/a(?<name>b)c/, "_$<name>_");
`,
			snapshot: `
"str".replace(/a(?<name>b)c/, "_$1_");
                                ~~
                                Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$1\`.
`,
		},
		{
			code: String.raw`
"str".replace(/a(?<name>b)c/v, "_$1_");
`,
			output: String.raw`
"str".replace(/a(?<name>b)c/v, "_$<name>_");
`,
			snapshot: `
"str".replace(/a(?<name>b)c/v, "_$1_");
                                 ~~
                                 Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$1\`.
`,
		},
		{
			code: String.raw`
"str".replaceAll(/a(?<name>b)c/g, "_$1_");
`,
			output: String.raw`
"str".replaceAll(/a(?<name>b)c/g, "_$<name>_");
`,
			snapshot: `
"str".replaceAll(/a(?<name>b)c/g, "_$1_");
                                    ~~
                                    Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$1\`.
`,
		},
		{
			code: String.raw`
"str".replace(/(a)(?<name>b)c/, "_$1$2_");
`,
			output: String.raw`
"str".replace(/(a)(?<name>b)c/, "_$1$<name>_");
`,
			snapshot: `
"str".replace(/(a)(?<name>b)c/, "_$1$2_");
                                    ~~
                                    Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$2\`.
`,
		},
		{
			code: String.raw`
"str".replace(/(?<first>a)(?<second>b)/, "$1-$2");
`,
			output: String.raw`
"str".replace(/(?<first>a)(?<second>b)/, "$<first>-$<second>");
`,
			snapshot: `
"str".replace(/(?<first>a)(?<second>b)/, "$1-$2");
                                          ~~
                                          Prefer the explicit named replacement \`$<first>\` over the position-specific indexed replacement \`$1\`.
                                             ~~
                                             Prefer the explicit named replacement \`$<second>\` over the position-specific indexed replacement \`$2\`.
`,
		},
	],
	valid: [
		String.raw`"str".replace(/regexp/, "foo")`,
		String.raw`"str".replace(/a(b)c/, "_$1_")`,
		String.raw`"str".replaceAll(/a(b)c/g, "_$1_")`,
		String.raw`"str".replace(/a(?<name>b)c/, "_$<name>_")`,
		String.raw`"str".replaceAll(/a(?<name>b)c/g, "_$<name>_")`,
		String.raw`"str".replace(/a(?<name>b)c/, "_$0_")`,
		String.raw`"str".replace(/(a)(?<name>b)c/, "_$1_")`,
		String.raw`"str".replace(/a(b)c/, "_$2_")`,
	],
});
