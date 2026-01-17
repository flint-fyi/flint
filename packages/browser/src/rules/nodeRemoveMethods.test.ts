import rule from "./nodeRemoveMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const parentNode: HTMLElement;
declare const childNode: HTMLElement;
parentNode.removeChild(childNode);
`,
			output: `
declare const parentNode: HTMLElement;
declare const childNode: HTMLElement;
childNode.remove();
			`,
			snapshot: `
declare const parentNode: HTMLElement;
declare const childNode: HTMLElement;
parentNode.removeChild(childNode);
           ~~~~~~~~~~~
           Prefer the modern \`childNode.remove()\` over \`parentNode.removeChild(childNode)\`.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.parentNode.removeChild(element);
`,
			output: `
declare const element: HTMLElement;
element.remove();
			`,
			snapshot: `
declare const element: HTMLElement;
element.parentNode.removeChild(element);
                   ~~~~~~~~~~~
                   Prefer the modern \`element.remove()\` over \`element.parentNode.removeChild(element)\`.
`,
		},
		{
			code: `
declare const node: HTMLElement;
node.parentElement.removeChild(node);
`,
			output: `
declare const node: HTMLElement;
node.remove();
`,
			snapshot: `
declare const node: HTMLElement;
node.parentElement.removeChild(node);
                   ~~~~~~~~~~~
                   Prefer the modern \`node.remove()\` over \`node.parentElement.removeChild(node)\`.
`,
		},
		{
			code: `
document.body.removeChild(footer);
`,
			output: `
footer.remove();
`,
			snapshot: `
document.body.removeChild(footer);
              ~~~~~~~~~~~
              Prefer the modern \`footer.remove()\` over \`document.body.removeChild(footer)\`.
`,
		},
	],
	valid: [
		`
declare const parentNode: { removeChild: (child: HTMLElement): void };
declare const childNode: HTMLElement;
parentNode.removeChild(childNode);
`,
		`
declare const element: HTMLElement;
element.remove();
`,
		`
declare const node: HTMLElement;
node.remove();
`,
		`
declare const child: HTMLElement;
child.parentNode.appendChild(child);
`,
		`
declare const parent: HTMLElement;
parent.replaceChild(newChild, oldChild);
`,
		`
declare const other: HTMLElement;
other.removeChild();
`,
		`
declare const node: HTMLElement;
declare function removeChild(child: HTMLElement): void;
removeChild(node);
`,
	],
});
