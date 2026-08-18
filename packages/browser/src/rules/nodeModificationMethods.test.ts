import rule from "./nodeModificationMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const parentNode: Node;
declare const newNode: Node;
declare const oldNode: Node;
parentNode.replaceChild(newNode, oldNode);
`,
			snapshot: `
declare const parentNode: Node;
declare const newNode: Node;
declare const oldNode: Node;
parentNode.replaceChild(newNode, oldNode);
           ~~~~~~~~~~~~
           Prefer \`.replaceWith()\` over \`.replaceChild()\`.
`,
		},
		{
			code: `
declare const element: HTMLElement;
declare const oldElement: Node;
element.parentNode!.replaceChild(element, oldElement);
`,
			snapshot: `
declare const element: HTMLElement;
declare const oldElement: Node;
element.parentNode!.replaceChild(element, oldElement);
                    ~~~~~~~~~~~~
                    Prefer \`.replaceWith()\` over \`.replaceChild()\`.
`,
		},
		{
			code: `
declare const parentNode: Node;
declare const newNode: Node;
declare const referenceNode: Node;
parentNode.insertBefore(newNode, referenceNode);
`,
			snapshot: `
declare const parentNode: Node;
declare const newNode: Node;
declare const referenceNode: Node;
parentNode.insertBefore(newNode, referenceNode);
           ~~~~~~~~~~~~
           Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
declare const parentNode: Node;
declare const node: Node;
parentNode.insertBefore(node, parentNode.firstChild);
`,
			snapshot: `
declare const parentNode: Node;
declare const node: Node;
parentNode.insertBefore(node, parentNode.firstChild);
           ~~~~~~~~~~~~
           Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
declare const referenceNode: Element;
referenceNode.insertAdjacentText("beforebegin", "text");
`,
			snapshot: `
declare const referenceNode: Element;
referenceNode.insertAdjacentText("beforebegin", "text");
              ~~~~~~~~~~~~~~~~~~
              Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
declare const element: Element;
element.insertAdjacentText("afterbegin", "content");
`,
			snapshot: `
declare const element: Element;
element.insertAdjacentText("afterbegin", "content");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.prepend()\` over \`.insertAdjacentElement('afterbegin', ...)\` or \`.insertAdjacentText('afterbegin', ...)\`.
`,
		},
		{
			code: `
declare const element: Element;
element.insertAdjacentText("beforeend", "text");
`,
			snapshot: `
declare const element: Element;
element.insertAdjacentText("beforeend", "text");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.append()\` over \`.insertAdjacentElement('beforeend', ...)\` or \`.insertAdjacentText('beforeend', ...)\`.
`,
		},
		{
			code: `
declare const element: Element;
element.insertAdjacentText("afterend", "text");
`,
			snapshot: `
declare const element: Element;
element.insertAdjacentText("afterend", "text");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.after()\` over \`.insertAdjacentElement('afterend', ...)\` or \`.insertAdjacentText('afterend', ...)\`.
`,
		},
		{
			code: `
declare const referenceNode: Element;
declare const newNode: Element;
referenceNode.insertAdjacentElement("beforebegin", newNode);
`,
			snapshot: `
declare const referenceNode: Element;
declare const newNode: Element;
referenceNode.insertAdjacentElement("beforebegin", newNode);
              ~~~~~~~~~~~~~~~~~~~~~
              Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
declare const element: Element;
declare const newNode: Element;
element.insertAdjacentElement("afterbegin", newNode);
`,
			snapshot: `
declare const element: Element;
declare const newNode: Element;
element.insertAdjacentElement("afterbegin", newNode);
        ~~~~~~~~~~~~~~~~~~~~~
        Prefer \`.prepend()\` over \`.insertAdjacentElement('afterbegin', ...)\` or \`.insertAdjacentText('afterbegin', ...)\`.
`,
		},
		{
			code: `
declare const element: Element;
declare const newNode: Element;
element.insertAdjacentElement("beforeend", newNode);
`,
			snapshot: `
declare const element: Element;
declare const newNode: Element;
element.insertAdjacentElement("beforeend", newNode);
        ~~~~~~~~~~~~~~~~~~~~~
        Prefer \`.append()\` over \`.insertAdjacentElement('beforeend', ...)\` or \`.insertAdjacentText('beforeend', ...)\`.
`,
		},
		{
			code: `
declare const referenceNode: Element;
declare const newNode: Element;
referenceNode.insertAdjacentElement("afterend", newNode);
`,
			snapshot: `
declare const referenceNode: Element;
declare const newNode: Element;
referenceNode.insertAdjacentElement("afterend", newNode);
              ~~~~~~~~~~~~~~~~~~~~~
              Prefer \`.after()\` over \`.insertAdjacentElement('afterend', ...)\` or \`.insertAdjacentText('afterend', ...)\`.
`,
		},
		{
			code: `
declare const element: { insertAdjacentText(position: string, value: string): void };
element.insertAdjacentText("BeforeBegin", "text");
`,
			snapshot: `
declare const element: { insertAdjacentText(position: string, value: string): void };
element.insertAdjacentText("BeforeBegin", "text");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
declare const element: { insertAdjacentElement(position: string, element: Element): void };
declare const newNode: Element;
element.insertAdjacentElement("AFTEREND", newNode);
`,
			snapshot: `
declare const element: { insertAdjacentElement(position: string, element: Element): void };
declare const newNode: Element;
element.insertAdjacentElement("AFTEREND", newNode);
        ~~~~~~~~~~~~~~~~~~~~~
        Prefer \`.after()\` over \`.insertAdjacentElement('afterend', ...)\` or \`.insertAdjacentText('afterend', ...)\`.
`,
		},
	],
	valid: [
		`
			declare const oldNode: Element;
			declare const newNode: Node;
			oldNode.replaceWith(newNode);
		`,
		`
			declare const referenceNode: Element;
			declare const newNode: Node;
			referenceNode.before(newNode);
		`,
		`
			declare const referenceNode: Element;
			referenceNode.before("text");
		`,
		`
			declare const element: Element;
			element.prepend("text");
		`,
		`
			declare const element: Element;
			element.append("text");
		`,
		`
			declare const element: Element;
			element.after("text");
		`,
		`
			declare const element: Node;
			declare const child: Node;
			element.appendChild(child);
		`,
		`
			declare const element: Node;
			declare const child: Node;
			element.removeChild(child);
		`,
	],
});
