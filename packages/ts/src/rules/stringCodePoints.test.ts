import { ruleTester } from "./ruleTester.ts";
import rule from "./stringCodePoints.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const text: string;
text.charCodeAt(0);
`,
			snapshot: `
declare const text: string;
text.charCodeAt(0);
     ~~~~~~~~~~
     Prefer \`codePointAt\` over \`charCodeAt\` for proper Unicode support.
`,
		},
		{
			code: `
"hello".charCodeAt(0);
`,
			snapshot: `
"hello".charCodeAt(0);
        ~~~~~~~~~~
        Prefer \`codePointAt\` over \`charCodeAt\` for proper Unicode support.
`,
		},
		{
			code: `
declare const index: number;
\`template\`.charCodeAt(index);
`,
			snapshot: `
declare const index: number;
\`template\`.charCodeAt(index);
           ~~~~~~~~~~
           Prefer \`codePointAt\` over \`charCodeAt\` for proper Unicode support.
`,
		},
		{
			code: `
String.fromCharCode(65);
`,
			snapshot: `
String.fromCharCode(65);
       ~~~~~~~~~~~~
       Prefer \`String.fromCodePoint\` over \`String.fromCharCode\` for proper Unicode support.
`,
		},
		{
			code: `
String.fromCharCode(0x1F600);
`,
			snapshot: `
String.fromCharCode(0x1F600);
       ~~~~~~~~~~~~
       Prefer \`String.fromCodePoint\` over \`String.fromCharCode\` for proper Unicode support.
`,
		},
	],
	valid: [
		`declare const text: string; text.codePointAt(0);`,
		`String.fromCodePoint(65);`,
		`String.fromCodePoint(0x1F600);`,
		`
const obj = {
	charCodeAt(index: number) {
		return 0;
	}
};
obj.charCodeAt(0);
`,
		`
class Custom {
	charCodeAt(index: number) {
		return index;
	}
}
declare const custom: Custom;
custom.charCodeAt(0);
`,
		`
const String = { fromCharCode: (code: number) => "" };
String.fromCharCode(65);
export {};
`,
	],
});
