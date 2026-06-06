import rule from "./nodeAppendMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const element: HTMLElement;
declare const child: Node;
element.appendChild(child);
`,
			snapshot: `
declare const element: HTMLElement;
declare const child: Node;
element.appendChild(child);
        ~~~~~~~~~~~
        \`append()\` is more modern and flexible than \`appendChild()\`.
`,
		},
		{
			code: `
declare const node: HTMLElement;
declare const child: Node;
node.insertBefore(child, null);
`,
			snapshot: `
declare const node: HTMLElement;
declare const child: Node;
node.insertBefore(child, null);
     ~~~~~~~~~~~~
     \`append()\` is more modern and flexible than \`insertBefore()\`.
`,
		},
		{
			code: `
declare const node: HTMLElement;
declare const child: Node;
declare const parentNode: Node;
node.insertBefore(child, parentNode.firstChild);
`,
			snapshot: `
declare const node: HTMLElement;
declare const child: Node;
declare const parentNode: Node;
node.insertBefore(child, parentNode.firstChild);
     ~~~~~~~~~~~~
     \`prepend()\` is more modern and flexible than \`insertBefore()\`.
`,
		},
		{
			code: `
declare const element: HTMLElement;
document.body.appendChild(element);
`,
			snapshot: `
declare const element: HTMLElement;
document.body.appendChild(element);
              ~~~~~~~~~~~
              \`append()\` is more modern and flexible than \`appendChild()\`.
`,
		},
	],
	valid: [
		`
declare const element: HTMLElement;
declare const child: Node;
element.append(child);
`,
		`
declare const node: HTMLElement;
declare const newNode: Node;
node.prepend(newNode);
`,
		`
declare const element: HTMLElement;
declare const child1: Node;
declare const child2: Node;
element.append(child1, child2);
`,
		`
declare const element: HTMLElement;
element.append("text");
`,
		`
declare const node: HTMLElement;
declare const child: Node;
node.append(child);
`,
		`
declare const other: { appendChild: () => void };
other.appendChild();
`,
		`
declare const element: { method: () => void };
element.method();
`,
		`
declare const node: HTMLElement;
declare const child: Node;
declare const referenceNode: Node;
node.insertBefore(child, referenceNode);
`,
	],
});
