import rule from "./blobReadingMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const text = await new Response(blob).text();
`,
			snapshot: `
const text = await new Response(blob).text();
                   ~~~~~~~~~~~~~~~~~~~~~~~~~
                   Prefer \`blob.text()\` over \`new Response(blob).text()\`.
`,
		},
		{
			code: `
const arrayBuffer = await new Response(blob).arrayBuffer();
`,
			snapshot: `
const arrayBuffer = await new Response(blob).arrayBuffer();
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                          Prefer \`blob.arrayBuffer()\` over \`new Response(blob).arrayBuffer()\`.
`,
		},
		{
			code: `
const bytes = await new Response(blob).bytes();
`,
			snapshot: `
const bytes = await new Response(blob).bytes();
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~
                    Prefer \`blob.bytes()\` over \`new Response(blob).bytes()\`.
`,
		},
		{
			code: `
new Response(blobData).text().then(console.log);
`,
			snapshot: `
new Response(blobData).text().then(console.log);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`blob.text()\` over \`new Response(blob).text()\`.
`,
		},
		{
			code: `
const result = new Response(myBlob).arrayBuffer();
`,
			snapshot: `
const result = new Response(myBlob).arrayBuffer();
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`blob.arrayBuffer()\` over \`new Response(blob).arrayBuffer()\`.
`,
		},
	],
	valid: [
		`const text = await blob.text();`,
		`const arrayBuffer = await blob.arrayBuffer();`,
		`const bytes = await blob.bytes();`,
		`const response = new Response(blob);`,
		`new Response(notABlob).json();`,
		`new Response().text();`,
		`blob.text();`,
		`response.text();`,
		`const data = await fetch(url).then(res => res.text());`,
		`
declare class Response {
  constructor(blob: unknown);
  text(): Promise<void>;
}
await new Response(blob).text();
export {};
		`,
	],
});
