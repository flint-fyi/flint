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
declare const value: string;
element.setAttribute("data-my-value", value);
`,
			snapshot: `
declare const element: HTMLElement;
declare const value: string;
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
		`
			declare const element: HTMLElement;
			element.getAttribute("aria-label");
		`,
		`
			declare const element: HTMLElement;
			element.setAttribute("id", "value");
		`,
		`
			declare const element: HTMLElement;
			element.getAttribute("data");
		`,
		`
			declare const element: HTMLElement;
			element.getAttribute("data-");
		`,
		`
			declare const element: HTMLElement;
			element.removeAttribute("class");
		`,
		`
			declare const element: HTMLElement;
			element.hasAttribute("hidden");
		`,
		`
			declare const element: HTMLElement;
			declare const variable: string;
			element.getAttribute(variable);
		`,
		`
			declare const element: HTMLElement;
			element.dataset.foo;
		`,
		`
			declare const element: {
				getAttribute(name: string): string;
			};
			element.getAttribute("data-foo");
		`,
	],
});
