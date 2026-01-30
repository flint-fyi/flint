import { ruleTester } from "./ruleTester.ts";
import rule from "./stringSliceMethods.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"...".substring(1);
`,
			snapshot: `
"...".substring(1);
      ~~~~~~~~~
      Prefer \`slice\` over \`substring\` for more consistent behavior.
`,
			suggestions: [
				{
					id: "replaceWithSlice",
					updated: `
"...".slice(1);
`,
				},
			],
		},
		{
			code: `
declare const text: string;
const result = text.substring(1);
`,
			snapshot: `
declare const text: string;
const result = text.substring(1);
                    ~~~~~~~~~
                    Prefer \`slice\` over \`substring\` for more consistent behavior.
`,
			suggestions: [
				{
					id: "replaceWithSlice",
					updated: `
declare const text: string;
const result = text.slice(1);
`,
				},
			],
		},
		{
			code: `
declare const text: string;
const result = text.substring(1, 5);
`,
			snapshot: `
declare const text: string;
const result = text.substring(1, 5);
                    ~~~~~~~~~
                    Prefer \`slice\` over \`substring\` for more consistent behavior.
`,
			suggestions: [
				{
					id: "replaceWithSlice",
					updated: `
declare const text: string;
const result = text.slice(1, 5);
`,
				},
			],
		},
		{
			code: `
function process(input: string) {
    return input.substring(0, input.length - 1);
}
`,
			snapshot: `
function process(input: string) {
    return input.substring(0, input.length - 1);
                 ~~~~~~~~~
                 Prefer \`slice\` over \`substring\` for more consistent behavior.
}
`,
			suggestions: [
				{
					id: "replaceWithSlice",
					updated: `
function process(input: string) {
    return input.slice(0, input.length - 1);
}
`,
				},
			],
		},
	],
	valid: [
		`text.slice(1);`,
		`text.slice(1, 5);`,
		`"hello".slice(0, 3);`,
		`str?.slice(1);`,
		`const substr = text.substr(0);`,
		`const substring = text.substring;`,
		`text.trim();`,
	],
});
