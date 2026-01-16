import rule from "./globalThisAliases.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = window.localStorage;
`,
			snapshot: `
const value = window.localStorage;
              ~~~~~~
              Prefer \`globalThis\` over \`window\` to access the global object.
`,
		},
		{
			code: `
const value = self.postMessage;
`,
			snapshot: `
const value = self.postMessage;
              ~~~~
              Prefer \`globalThis\` over \`self\` to access the global object.
`,
		},

		{
			code: `
window.addEventListener("load", handler);
`,
			snapshot: `
window.addEventListener("load", handler);
~~~~~~
Prefer \`globalThis\` over \`window\` to access the global object.
`,
		},
		{
			code: `
console.log(window);
`,
			snapshot: `
console.log(window);
            ~~~~~~
            Prefer \`globalThis\` over \`window\` to access the global object.
`,
		},
		{
			code: `
const ref = window;
`,
			snapshot: `
const ref = window;
            ~~~~~~
            Prefer \`globalThis\` over \`window\` to access the global object.
`,
		},
		{
			code: `
if (typeof window !== "undefined") {}
`,
			snapshot: `
if (typeof window !== "undefined") {}
           ~~~~~~
           Prefer \`globalThis\` over \`window\` to access the global object.
`,
		},
	],
	valid: [
		`const value = globalThis.localStorage;`,
		`globalThis.addEventListener("load", handler);`,
		`function example(window: { inner: boolean }) { console.log(window); }`,
		`function example(window: Window) { return window.innerWidth; }`,
		`const object = { window: true };`,
		`const { window } = config;`,
		`class Example { window = true; }`,
		`interface Config { window: boolean; }`,
		`const value = object.window;`,
	],
});
