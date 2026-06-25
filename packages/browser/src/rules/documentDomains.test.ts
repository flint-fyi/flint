import rule from "./documentDomains.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const currentDomain = document.domain;
console.log(currentDomain);
`,
			snapshot: `
const currentDomain = document.domain;
                               ~~~~~~
                               The \`document.domain\` API relaxes same-origin protections.
console.log(currentDomain);
`,
		},
		{
			code: `
document.domain = "example.com";
`,
			snapshot: `
document.domain = "example.com";
         ~~~~~~
         The \`document.domain\` API relaxes same-origin protections.
`,
		},
		{
			code: `
window.document.domain = "example.com";
`,
			snapshot: `
window.document.domain = "example.com";
                ~~~~~~
                The \`document.domain\` API relaxes same-origin protections.
`,
		},
	],
	valid: [
		`document.createElement("iframe");`,
		`other.document.domain = "example.com";`,
		`
			const document = { domain: "example.com" };
			console.log(document.domain);
			export {};
		`,
		`
			const window = { document: { domain: "example.com" } };
			console.log(window.document.domain);
			export {};
		`,
	],
});
