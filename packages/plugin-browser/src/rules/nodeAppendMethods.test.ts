import rule from "./nodeAppendMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const element: HTMLElement;
element.appendChild(child);
`,
			snapshot: `
declare const element: HTMLElement;
element.appendChild(child);
        ~~~~~~~~~~~
        \`append()\` is more modern and flexible than \`appendChild()\`.
`,
		},
		{
			code: `
declare const node: HTMLElement;
node.insertBefore(child, null);
`,
			snapshot: `
declare const node: HTMLElement;
node.insertBefore(child, null);
     ~~~~~~~~~~~~
     \`append()\` is more modern and flexible than \`insertBefore()\`.
`,
		},
		{
			code: `
declare const node: HTMLElement;
node.insertBefore(child, parent.firstChild);
`,
			snapshot: `
declare const node: HTMLElement;
node.insertBefore(child, parent.firstChild);
     ~~~~~~~~~~~~
     \`prepend()\` is more modern and flexible than \`insertBefore()\`.
`,
		},
		{
			code: `
document.body.appendChild(element);
`,
			snapshot: `
document.body.appendChild(element);
              ~~~~~~~~~~~
              \`append()\` is more modern and flexible than \`appendChild()\`.
`,
		},
	],
	valid: [
		`
declare const element: HTMLElement;
element.append(child);
`,
		`
declare const node: HTMLElement;
node.prepend(newNode);
`,
		`
declare const element: HTMLElement;
element.append(child1, child2);
`,
		`
declare const element: HTMLElement;
element.append("text");
`,
		`
declare const node: HTMLElement;
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
node.insertBefore(child, referenceNode);
`,
	],
});
