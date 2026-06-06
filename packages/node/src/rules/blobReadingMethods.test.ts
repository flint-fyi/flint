import rule from "./blobReadingMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const blob: Blob;
const text = await new Response(blob).text();
export {};
`,
			snapshot: `
declare const blob: Blob;
const text = await new Response(blob).text();
                   ~~~~~~~~~~~~~~~~~~~~~~~~~
                   Prefer \`blob.text()\` over \`new Response(blob).text()\`.
export {};
`,
		},
		{
			code: `
declare const blob: Blob;
const arrayBuffer = await new Response(blob).arrayBuffer();
export {};
`,
			snapshot: `
declare const blob: Blob;
const arrayBuffer = await new Response(blob).arrayBuffer();
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                          Prefer \`blob.arrayBuffer()\` over \`new Response(blob).arrayBuffer()\`.
export {};
`,
		},
		{
			code: `
declare const blob: Blob;
const bytes = await new Response(blob).bytes();
export {};
`,
			snapshot: `
declare const blob: Blob;
const bytes = await new Response(blob).bytes();
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~
                    Prefer \`blob.bytes()\` over \`new Response(blob).bytes()\`.
export {};
`,
		},
		{
			code: `
declare const blobData: Blob;
new Response(blobData).text().then(console.log);
`,
			snapshot: `
declare const blobData: Blob;
new Response(blobData).text().then(console.log);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`blob.text()\` over \`new Response(blob).text()\`.
`,
		},
		{
			code: `
declare const myBlob: Blob;
const result = new Response(myBlob).arrayBuffer();
`,
			snapshot: `
declare const myBlob: Blob;
const result = new Response(myBlob).arrayBuffer();
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`blob.arrayBuffer()\` over \`new Response(blob).arrayBuffer()\`.
`,
		},
	],
	valid: [
		`declare const blob: Blob;
const text = await blob.text();
export {};`,
		`declare const blob: Blob;
const arrayBuffer = await blob.arrayBuffer();
export {};`,
		`declare const blob: Blob;
const bytes = await blob.bytes();
export {};`,
		`declare const blob: Blob;
const response = new Response(blob);`,
		`declare const notABlob: Blob;
new Response(notABlob).json();`,
		`new Response().text();`,
		`declare const blob: Blob;
blob.text();`,
		`declare const response: Response;
response.text();`,
		`declare const url: string;
const data = await fetch(url).then(res => res.text());
export {};`,
		`
declare const blob: Blob;
declare class Response {
  constructor(blob: unknown);
  text(): Promise<void>;
}
await new Response(blob).text();
export {};
		`,
	],
});
