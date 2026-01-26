import rule from "./stringTrimMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = str.trimLeft();
`,
			snapshot: `
const result = str.trimLeft();
                   ~~~~~~~~
                   Prefer \`trimStart()\` over \`trimLeft()\`.
`,
		},
		{
			code: `
const result = str.trimRight();
`,
			snapshot: `
const result = str.trimRight();
                   ~~~~~~~~~
                   Prefer \`trimEnd()\` over \`trimRight()\`.
`,
		},
		{
			code: `
const result = "  hello  ".trimLeft();
`,
			snapshot: `
const result = "  hello  ".trimLeft();
                           ~~~~~~~~
                           Prefer \`trimStart()\` over \`trimLeft()\`.
`,
		},
		{
			code: `
const result = "  hello  ".trimRight();
`,
			snapshot: `
const result = "  hello  ".trimRight();
                           ~~~~~~~~~
                           Prefer \`trimEnd()\` over \`trimRight()\`.
`,
		},
		{
			code: `
function clean(input: string) {
    return input.trimLeft().trimRight();
}
`,
			snapshot: `
function clean(input: string) {
    return input.trimLeft().trimRight();
                            ~~~~~~~~~
                            Prefer \`trimEnd()\` over \`trimRight()\`.
                 ~~~~~~~~
                 Prefer \`trimStart()\` over \`trimLeft()\`.
}
`,
		},
		{
			code: `
const result = text?.trimLeft();
`,
			snapshot: `
const result = text?.trimLeft();
                     ~~~~~~~~
                     Prefer \`trimStart()\` over \`trimLeft()\`.
`,
		},
	],
	valid: [
		`const result = str.trimStart();`,
		`const result = str.trimEnd();`,
		`const result = str.trim();`,
		`const result = str.trimLeft;`,
		`const result = str.trimRight;`,
		`const result = trimLeft();`,
		`const result = str["trimLeft"]();`,
	],
});
