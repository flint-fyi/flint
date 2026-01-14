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
window.location = "javascript:void(0)";
			`,
			snapshot: `
window.location = "javascript:void(0)";
                  ~~~~~~~~~~~~~~~~~~~~
                  This \`javascript:\` URL is a form of eval.
			`,
		},
		{
			code: `
const evil = \`javascript:\${code}\`;
`,
			snapshot: `
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
		`const url = \`\${protocol}javascript:\`;`,
		`const url = html\`javascript:void(0)\`;`,
		`const text = "This is about JavaScript: the language";`,
		`const href = "/page";`,
		`const data = "data:text/plain;base64,SGVsbG8=";`,
	],
});
