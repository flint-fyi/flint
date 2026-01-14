import rule from "./documentCookies.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = document.cookie;
`,
			snapshot: `
const value = document.cookie;
                       ~~~~~~
                       Direct use of \`document.cookie\` is error-prone and has security implications.
`,
		},
		{
			code: `
document.cookie = "name=value";
`,
			snapshot: `
document.cookie = "name=value";
         ~~~~~~
         Direct use of \`document.cookie\` is error-prone and has security implications.
`,
		},
		{
			code: `
const cookies = document.cookie.split(";");
`,
			snapshot: `
const cookies = document.cookie.split(";");
                         ~~~~~~
                         Direct use of \`document.cookie\` is error-prone and has security implications.
`,
		},
		{
			code: `
if (document.cookie.includes("session")) {
    console.log("Has session");
}
`,
			snapshot: `
if (document.cookie.includes("session")) {
             ~~~~~~
             Direct use of \`document.cookie\` is error-prone and has security implications.
    console.log("Has session");
}
`,
		},
	],
	valid: [
		`const value = cookieStore.get("name");`,
		`cookieManager.set("name", "value");`,
		`const doc = { cookie: "value" }; const x = doc.cookie;`,
		`
			interface Document { cookie: string; }
			const document: Document = { cookie: "test" };
			const value = document.cookie;
			export {};
		`,
	],
});
