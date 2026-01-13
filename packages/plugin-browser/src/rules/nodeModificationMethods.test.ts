import rule from "./nodeModificationMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
parentNode.replaceChild(newNode, oldNode);
`,
			snapshot: `
parentNode.replaceChild(newNode, oldNode);
           ~~~~~~~~~~~~
           Prefer \`.replaceWith()\` over \`.replaceChild()\`.
`,
		},
		{
			code: `
element.parentNode.replaceChild(element, oldElement);
`,
			snapshot: `
element.parentNode.replaceChild(element, oldElement);
                   ~~~~~~~~~~~~
                   Prefer \`.replaceWith()\` over \`.replaceChild()\`.
`,
		},
		{
			code: `
parentNode.insertBefore(newNode, referenceNode);
`,
			snapshot: `
parentNode.insertBefore(newNode, referenceNode);
           ~~~~~~~~~~~~
           Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
parent.insertBefore(node, parent.firstChild);
`,
			snapshot: `
parent.insertBefore(node, parent.firstChild);
       ~~~~~~~~~~~~
       Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
referenceNode.insertAdjacentText("beforebegin", "text");
`,
			snapshot: `
referenceNode.insertAdjacentText("beforebegin", "text");
              ~~~~~~~~~~~~~~~~~~
              Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
element.insertAdjacentText("afterbegin", "content");
`,
			snapshot: `
element.insertAdjacentText("afterbegin", "content");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.prepend()\` over \`.insertAdjacentElement('afterbegin', ...)\` or \`.insertAdjacentText('afterbegin', ...)\`.
`,
		},
		{
			code: `
element.insertAdjacentText("beforeend", "text");
`,
			snapshot: `
element.insertAdjacentText("beforeend", "text");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.append()\` over \`.insertAdjacentElement('beforeend', ...)\` or \`.insertAdjacentText('beforeend', ...)\`.
`,
		},
		{
			code: `
element.insertAdjacentText("afterend", "text");
`,
			snapshot: `
element.insertAdjacentText("afterend", "text");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.after()\` over \`.insertAdjacentElement('afterend', ...)\` or \`.insertAdjacentText('afterend', ...)\`.
`,
		},
		{
			code: `
referenceNode.insertAdjacentElement("beforebegin", newNode);
`,
			snapshot: `
referenceNode.insertAdjacentElement("beforebegin", newNode);
              ~~~~~~~~~~~~~~~~~~~~~
              Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
element.insertAdjacentElement("afterbegin", newNode);
`,
			snapshot: `
element.insertAdjacentElement("afterbegin", newNode);
        ~~~~~~~~~~~~~~~~~~~~~
        Prefer \`.prepend()\` over \`.insertAdjacentElement('afterbegin', ...)\` or \`.insertAdjacentText('afterbegin', ...)\`.
`,
		},
		{
			code: `
element.insertAdjacentElement("beforeend", newNode);
`,
			snapshot: `
element.insertAdjacentElement("beforeend", newNode);
        ~~~~~~~~~~~~~~~~~~~~~
        Prefer \`.append()\` over \`.insertAdjacentElement('beforeend', ...)\` or \`.insertAdjacentText('beforeend', ...)\`.
`,
		},
		{
			code: `
referenceNode.insertAdjacentElement("afterend", newNode);
`,
			snapshot: `
referenceNode.insertAdjacentElement("afterend", newNode);
              ~~~~~~~~~~~~~~~~~~~~~
              Prefer \`.after()\` over \`.insertAdjacentElement('afterend', ...)\` or \`.insertAdjacentText('afterend', ...)\`.
`,
		},
		{
			code: `
element.insertAdjacentText("BeforeBegin", "text");
`,
			snapshot: `
element.insertAdjacentText("BeforeBegin", "text");
        ~~~~~~~~~~~~~~~~~~
        Prefer \`.before()\` over \`.insertBefore()\`, \`.insertAdjacentElement('beforebegin', ...)\`, or \`.insertAdjacentText('beforebegin', ...)\`.
`,
		},
		{
			code: `
element.insertAdjacentElement("AFTEREND", newNode);
`,
			snapshot: `
element.insertAdjacentElement("AFTEREND", newNode);
        ~~~~~~~~~~~~~~~~~~~~~
        Prefer \`.after()\` over \`.insertAdjacentElement('afterend', ...)\` or \`.insertAdjacentText('afterend', ...)\`.
`,
		},
	],
	valid: [
		`oldNode.replaceWith(newNode);`,
		`referenceNode.before(newNode);`,
		`referenceNode.before("text");`,
		`element.prepend("text");`,
		`element.append("text");`,
		`element.after("text");`,
		`element.appendChild(child);`,
		`element.removeChild(child);`,
	],
});
