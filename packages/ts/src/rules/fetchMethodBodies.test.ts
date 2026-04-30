import rule from "./fetchMethodBodies.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const response = await fetch("/", { body: "data" });
`,
			snapshot: `
const response = await fetch("/", { body: "data" });
                                    ~~~~
                                    \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
const request = new Request("/", { body: "data" });
`,
			snapshot: `
const request = new Request("/", { body: "data" });
                                   ~~~~
                                   \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
const response = await fetch("/", { method: "GET", body: "data" });
`,
			snapshot: `
const response = await fetch("/", { method: "GET", body: "data" });
                                                   ~~~~
                                                   \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
const response = await fetch("/", { method: "get", body: "data" });
`,
			snapshot: `
const response = await fetch("/", { method: "get", body: "data" });
                                                   ~~~~
                                                   \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
const response = await fetch("/", { method: "HEAD", body: "data" });
`,
			snapshot: `
const response = await fetch("/", { method: "HEAD", body: "data" });
                                                    ~~~~
                                                    \`body\` is not allowed when the request method is \`HEAD\`.
`,
		},
		{
			code: `
const response = await fetch("/", { method: "head", body: "data" });
`,
			snapshot: `
const response = await fetch("/", { method: "head", body: "data" });
                                                    ~~~~
                                                    \`body\` is not allowed when the request method is \`HEAD\`.
`,
		},
		{
			code: `
const request = new Request("/", { method: "GET", body: "data" });
`,
			snapshot: `
const request = new Request("/", { method: "GET", body: "data" });
                                                  ~~~~
                                                  \`body\` is not allowed when the request method is \`GET\`.
`,
		},
		{
			code: `
const request = new Request("/", { method: "HEAD", body: "data" });
`,
			snapshot: `
const request = new Request("/", { method: "HEAD", body: "data" });
                                                   ~~~~
                                                   \`body\` is not allowed when the request method is \`HEAD\`.
`,
		},
	],
	valid: [
		`const response = await fetch("/");`,
		`const response = await fetch("/", {});`,
		`const response = await fetch("/", { method: "POST" });`,
		`const response = await fetch("/", { method: "POST", body: "data" });`,
		`const response = await fetch("/", { method: "PUT", body: "data" });`,
		`const response = await fetch("/", { method: "PATCH", body: "data" });`,
		`const response = await fetch("/", { method: "DELETE", body: "data" });`,
		`const response = await fetch("/", { body: undefined });`,
		`const response = await fetch("/", { body: null });`,
		`const response = await fetch("/", { ...options, body: "data" });`,
		`const request = new Request("/");`,
		`const request = new Request("/", {});`,
		`const request = new Request("/", { method: "POST", body: "data" });`,
		`const request = new Request("/", { body: undefined });`,
		`const request = new Request("/", { body: null });`,
		`const request = new Request("/", { ...options, body: "data" });`,
		`myFetch("/", { body: "data" });`,
		`new MyRequest("/", { body: "data" });`,
	],
});
