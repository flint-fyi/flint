import { ruleTester } from "./ruleTester.ts";
import rule from "./scriptUrls.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
location.href = "javascript:void(0)";
`,
			snapshot: `
location.href = "javascript:void(0)";
                ~~~~~~~~~~~~~~~~~~~~
                This \`javascript:\` URL is a form of eval.
`,
		},
		{
			code: `
const url = "javascript:alert('XSS')";
`,
			snapshot: `
const url = "javascript:alert('XSS')";
            ~~~~~~~~~~~~~~~~~~~~~~~~~
            This \`javascript:\` URL is a form of eval.
`,
		},
		{
			code: `
const link = \`javascript:void(0)\`;
`,
			snapshot: `
const link = \`javascript:void(0)\`;
             ~~~~~~~~~~~~~~~~~~~~
             This \`javascript:\` URL is a form of eval.
`,
		},
		{
			code: `
const href = "JavaScript:void(0)";
`,
			snapshot: `
const href = "JavaScript:void(0)";
             ~~~~~~~~~~~~~~~~~~~~
             This \`javascript:\` URL is a form of eval.
`,
		},
		{
			code: `
const url = "JAVASCRIPT:doSomething()";
`,
			snapshot: `
const url = "JAVASCRIPT:doSomething()";
            ~~~~~~~~~~~~~~~~~~~~~~~~~~
            This \`javascript:\` URL is a form of eval.
`,
		},
		{
			code: `
window.location.href = "javascript:void(0)";
`,
			snapshot: `
window.location.href = "javascript:void(0)";
                       ~~~~~~~~~~~~~~~~~~~~
                       This \`javascript:\` URL is a form of eval.
`,
		},
		{
			code: `
declare const code: string;
const evil = \`javascript:\${code}\`;
`,
			snapshot: `
declare const code: string;
const evil = \`javascript:\${code}\`;
             ~~~~~~~~~~~~~~~~~~~~
             This \`javascript:\` URL is a form of eval.
`,
		},
	],
	valid: [
		`const url = "https://example.com";`,
		`const url = "http://example.com";`,
		// cspell:disable-next-line -- testing non-javascript protocol
		`const url = "xjavascript:";`,
		`const url = "not-javascript:";`,
		`const url = \`https://example.com\`;`,
		`
			declare const protocol: string;
			const url = \`\${protocol}javascript:\`;
		`,
		`
			declare function html(strings: TemplateStringsArray): string;
			const url = html\`javascript:void(0)\`;
		`,
		`const text = "This is about JavaScript: the language";`,
		`const href = "/page";`,
		`const data = "data:text/plain;base64,SGVsbG8=";`,
	],
});
