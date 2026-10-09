import rule from "./regexNamedReplacements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"str".replace(/a(?<name>b)c/, "_$1_");
`,
			output: `
"str".replace(/a(?<name>b)c/, "_$<name>_");
`,
			snapshot: `
"str".replace(/a(?<name>b)c/, "_$1_");
                                ~~
                                Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$1\`.
`,
		},
		{
			code: `
"str".replace(/a(?<name>b)c/v, "_$1_");
`,
			output: `
"str".replace(/a(?<name>b)c/v, "_$<name>_");
`,
			snapshot: `
"str".replace(/a(?<name>b)c/v, "_$1_");
                                 ~~
                                 Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$1\`.
`,
		},
		{
			code: `
"str".replaceAll(/a(?<name>b)c/g, "_$1_");
`,
			output: `
"str".replaceAll(/a(?<name>b)c/g, "_$<name>_");
`,
			snapshot: `
"str".replaceAll(/a(?<name>b)c/g, "_$1_");
                                    ~~
                                    Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$1\`.
`,
		},
		{
			code: `
"str".replace(/(a)(?<name>b)c/, "_$1$2_");
`,
			output: `
"str".replace(/(a)(?<name>b)c/, "_$1$<name>_");
`,
			snapshot: `
"str".replace(/(a)(?<name>b)c/, "_$1$2_");
                                    ~~
                                    Prefer the explicit named replacement \`$<name>\` over the position-specific indexed replacement \`$2\`.
`,
		},
		{
			code: `
"str".replace(/(?<first>a)(?<second>b)/, "$1-$2");
`,
			output: `
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
		'"str".replace(/regexp/, "foo")',
		'"str".replace(/a(b)c/, "_$1_")',
		'"str".replaceAll(/a(b)c/g, "_$1_")',
		'"str".replace(/a(?<name>b)c/, "_$<name>_")',
		'"str".replaceAll(/a(?<name>b)c/g, "_$<name>_")',
		'"str".replace(/a(?<name>b)c/, "_$0_")',
		'"str".replace(/(a)(?<name>b)c/, "_$1_")',
		'"str".replace(/a(b)c/, "_$2_")',
	],
});
