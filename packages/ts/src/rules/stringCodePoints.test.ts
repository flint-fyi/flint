import rule from "./stringCodePoints.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const code = str.charCodeAt(0);
`,
			snapshot: `
const code = str.charCodeAt(0);
                 ~~~~~~~~~~
                 Prefer \`codePointAt\` over \`charCodeAt\` for proper Unicode support.
`,
		},
		{
			code: `
const char = String.fromCharCode(65);
`,
			snapshot: `
const char = String.fromCharCode(65);
                    ~~~~~~~~~~~~
                    Prefer \`String.fromCodePoint\` over \`String.fromCharCode\` for proper Unicode support.
`,
		},
		{
			code: `
const emoji = String.fromCharCode(0xD83D, 0xDE00);
`,
			snapshot: `
const emoji = String.fromCharCode(0xD83D, 0xDE00);
                     ~~~~~~~~~~~~
                     Prefer \`String.fromCodePoint\` over \`String.fromCharCode\` for proper Unicode support.
`,
		},
		{
			code: `
function getCode(text: string) {
    return text.charCodeAt(text.length - 1);
}
`,
			snapshot: `
function getCode(text: string) {
    return text.charCodeAt(text.length - 1);
                ~~~~~~~~~~
                Prefer \`codePointAt\` over \`charCodeAt\` for proper Unicode support.
}
`,
		},
		{
			code: `
const reference = String.fromCharCode;
`,
			snapshot: `
const reference = String.fromCharCode;
                         ~~~~~~~~~~~~
                         Prefer \`String.fromCodePoint\` over \`String.fromCharCode\` for proper Unicode support.
`,
		},
	],
	valid: [
		`const code = str.codePointAt(0);`,
		`const char = String.fromCodePoint(65);`,
		`const code = charCodeAt(0);`,
		`const char = OtherClass.fromCharCode(65);`,
		`const char = fromCharCode(65);`,
		`const code = str["charCodeAt"](0);`,
	],
});
