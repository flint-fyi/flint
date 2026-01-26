import rule from "./stringSliceMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = text.substr(1);
`,
			snapshot: `
const result = text.substr(1);
                    ~~~~~~
                    Prefer \`slice\` over the deprecated \`substr\` method.
`,
		},
		{
			code: `
const result = text.substr(1, 5);
`,
			snapshot: `
const result = text.substr(1, 5);
                    ~~~~~~
                    Prefer \`slice\` over the deprecated \`substr\` method.
`,
		},
		{
			code: `
const result = text.substring(1);
`,
			snapshot: `
const result = text.substring(1);
                    ~~~~~~~~~
                    Prefer \`slice\` over \`substring\` for more consistent behavior.
`,
		},
		{
			code: `
const result = text.substring(1, 5);
`,
			snapshot: `
const result = text.substring(1, 5);
                    ~~~~~~~~~
                    Prefer \`slice\` over \`substring\` for more consistent behavior.
`,
		},
		{
			code: `
const result = "hello".substr(0, 3);
`,
			snapshot: `
const result = "hello".substr(0, 3);
                       ~~~~~~
                       Prefer \`slice\` over the deprecated \`substr\` method.
`,
		},
		{
			code: `
const result = str?.substr(1);
`,
			snapshot: `
const result = str?.substr(1);
                    ~~~~~~
                    Prefer \`slice\` over the deprecated \`substr\` method.
`,
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
		},
	],
	valid: [
		`const result = text.slice(1);`,
		`const result = text.slice(1, 5);`,
		`const result = "hello".slice(0, 3);`,
		`const result = str?.slice(1);`,
		`const substr = text.substr;`,
		`const substring = text.substring;`,
		`const result = text.trim();`,
	],
});
