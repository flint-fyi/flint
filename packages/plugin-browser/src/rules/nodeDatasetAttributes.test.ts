import rule from "./nodeDatasetAttributes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const element: HTMLElement;
element.getAttribute("data-foo");
`,
			snapshot: `
declare const element: HTMLElement;
element.getAttribute("data-foo");
        ~~~~~~~~~~~~
        Prefer using \`.dataset\` as a safer, more idiomatic API for accessing data-* attributes.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.setAttribute("data-foo", "bar");
`,
			snapshot: `
declare const element: HTMLElement;
element.setAttribute("data-foo", "bar");
        ~~~~~~~~~~~~
        Prefer using \`.dataset\` as a safer, more idiomatic API for accessing data-* attributes.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.removeAttribute("data-foo");
`,
			snapshot: `
declare const element: HTMLElement;
element.removeAttribute("data-foo");
        ~~~~~~~~~~~~~~~
        Prefer using \`.dataset\` as a safer, more idiomatic API for accessing data-* attributes.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.hasAttribute("data-foo");
`,
			snapshot: `
declare const element: HTMLElement;
element.hasAttribute("data-foo");
        ~~~~~~~~~~~~
        Prefer using \`.dataset\` as a safer, more idiomatic API for accessing data-* attributes.
`,
		},
		{
			code: `
declare const node: HTMLElement;
node.getAttribute("data-foo-bar");
`,
			snapshot: `
declare const node: HTMLElement;
node.getAttribute("data-foo-bar");
     ~~~~~~~~~~~~
     Prefer using \`.dataset\` as a safer, more idiomatic API for accessing data-* attributes.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.setAttribute("data-my-value", value);
`,
			snapshot: `
declare const element: HTMLElement;
element.setAttribute("data-my-value", value);
        ~~~~~~~~~~~~
        Prefer using \`.dataset\` as a safer, more idiomatic API for accessing data-* attributes.
`,
		},
		{
			code: `
declare const element: HTMLElement;
element.getAttribute(\`data-foo\`);
`,
			snapshot: `
declare const element: HTMLElement;
element.getAttribute(\`data-foo\`);
        ~~~~~~~~~~~~
        Prefer using \`.dataset\` as a safer, more idiomatic API for accessing data-* attributes.
`,
		},
	],
	valid: [
		`element.getAttribute("aria-label");`,
		`element.setAttribute("id", "value");`,
		`element.getAttribute("data");`,
		`element.getAttribute("data-");`,
		`element.removeAttribute("class");`,
		`element.hasAttribute("hidden");`,
		`element.getAttribute(variable);`,
		`element.dataset.foo;`,
		`
			declare const element: {
				getAttribute(name: string): string;
			};
			element.getAttribute("data-foo");
			export {};
		`,
	],
});
