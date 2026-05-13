import rule from "./nodeTextContents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const element: HTMLElement;
const text = element.innerText;
`,
			snapshot: `
declare const element: HTMLElement;
const text = element.innerText;
                     ~~~~~~~~~
                     Prefer the safer, more performant \`textContent\` over the legacy \`innerText\`.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.innerText = "Hello";
`,
			snapshot: `
declare const element: HTMLElement;
element.innerText = "Hello";
        ~~~~~~~~~
        Prefer the safer, more performant \`textContent\` over the legacy \`innerText\`.
`,
		},
		{
			code: `
declare const node: HTMLElement;
const content = node.innerText;
`,
			snapshot: `
declare const node: HTMLElement;
const content = node.innerText;
                     ~~~~~~~~~
                     Prefer the safer, more performant \`textContent\` over the legacy \`innerText\`.
`,
		},
		{
			code: `
declare const div: HTMLDivElement;
div.innerText = value;
`,
			snapshot: `
declare const div: HTMLDivElement;
div.innerText = value;
    ~~~~~~~~~
    Prefer the safer, more performant \`textContent\` over the legacy \`innerText\`.
`,
		},
		{
			code: `
const text = document.getElementById("id").innerText;
`,
			snapshot: `
const text = document.getElementById("id").innerText;
                                           ~~~~~~~~~
                                           Prefer the safer, more performant \`textContent\` over the legacy \`innerText\`.
`,
		},
	],
	valid: [
		`
declare const element: HTMLElement;
const text = element.textContent;
`,
		`
declare const element: { innerText: string };
const text = element.innerText;
`,
		`
declare const element: HTMLElement;
element.textContent = "Hello";
`,
		`
declare const node: HTMLElement;
const content = node.textContent;
`,
		`
declare const div: HTMLDivElement;
div.textContent = value;
`,
		`
const text = document.getElementById("id").textContent;
`,
		`
const obj = { innerText: "value" };
`,
		`
const innerText = "some text";
`,
	],
});
