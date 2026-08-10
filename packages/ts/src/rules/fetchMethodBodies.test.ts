import rule from "./fetchMethodBodies.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
fetch("/", { body: "data" });
`,
			snapshot: `
fetch("/", { body: "data" });
             ~~~~
             \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
new Request("/", { body: "data" });
`,
			snapshot: `
new Request("/", { body: "data" });
                   ~~~~
                   \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
fetch("/", { method: "GET", body: "data" });
`,
			snapshot: `
fetch("/", { method: "GET", body: "data" });
                            ~~~~
                            \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
fetch("/", { method: "get", body: "data" });
`,
			snapshot: `
fetch("/", { method: "get", body: "data" });
                            ~~~~
                            \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
fetch("/", { method: "HEAD", body: "data" });
`,
			snapshot: `
fetch("/", { method: "HEAD", body: "data" });
                             ~~~~
                             \`body\` is not allowed when the request method is \`HEAD\`.
`,
		},
		{
			code: `
fetch("/", { method: "head", body: "data" });
`,
			snapshot: `
fetch("/", { method: "head", body: "data" });
                             ~~~~
                             \`body\` is not allowed when the request method is \`HEAD\`.
`,
		},
		{
			code: `
new Request("/", { method: "GET", body: "data" });
`,
			snapshot: `
new Request("/", { method: "GET", body: "data" });
                                  ~~~~
                                  \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
new Request("/", { method: "HEAD", body: "data" });
`,
			snapshot: `
new Request("/", { method: "HEAD", body: "data" });
                                   ~~~~
                                   \`body\` is not allowed when the request method is \`HEAD\`.
`,
		},
	],
	valid: [
		`fetch("/");`,
		`fetch("/", {});`,
		`fetch("/", { method: "POST" });`,
		`fetch("/", { method: "POST", body: "data" });`,
		`fetch("/", { method: "PUT", body: "data" });`,
		`fetch("/", { method: "PATCH", body: "data" });`,
		`fetch("/", { method: "DELETE", body: "data" });`,
		`fetch("/", { body: undefined });`,
		`fetch("/", { body: null });`,
		`
declare const options: RequestInit;
fetch("/", { ...options, body: "data" });
`,
		`const request = new Request("/");`,
		`const request = new Request("/", {});`,
		`const request = new Request("/", { method: "POST", body: "data" });`,
		`const request = new Request("/", { body: undefined });`,
		`const request = new Request("/", { body: null });`,
		`
declare const options: RequestInit;
const request = new Request("/", { ...options, body: "data" });
`,
		`
declare function myFetch(input: string, init?: object): void;
myFetch("/", { body: "data" });
`,
		`
declare class MyRequest {
	constructor(input: string, init?: object);
}
new MyRequest("/", { body: "data" });
`,
	],
});
