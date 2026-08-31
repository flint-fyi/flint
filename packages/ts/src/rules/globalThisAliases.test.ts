import rule from "./globalThisAliases.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
window;
`,
			snapshot: `
window;
~~~~~~
Prefer the standard \`globalThis\` over the platform-specific \`window\` for accessing the global object.
`,
		},
		{
			code: `
const ref = window;
`,
			snapshot: `
const ref = window;
            ~~~~~~
            Prefer the standard \`globalThis\` over the platform-specific \`window\` for accessing the global object.
`,
		},
		{
			code: `
const value = window.localStorage;
`,
			snapshot: `
const value = window.localStorage;
              ~~~~~~
              Prefer the standard \`globalThis\` over the platform-specific \`window\` for accessing the global object.
`,
		},
		{
			code: `
const value = self.postMessage;
`,
			snapshot: `
const value = self.postMessage;
              ~~~~
              Prefer the standard \`globalThis\` over the platform-specific \`self\` for accessing the global object.
`,
		},

		{
			code: `
function handler() {}

window.addEventListener("load", handler);
`,
			snapshot: `
function handler() {}

window.addEventListener("load", handler);
~~~~~~
Prefer the standard \`globalThis\` over the platform-specific \`window\` for accessing the global object.
`,
		},
		{
			code: `
console.log(window);
`,
			snapshot: `
console.log(window);
            ~~~~~~
            Prefer the standard \`globalThis\` over the platform-specific \`window\` for accessing the global object.
`,
		},
		{
			code: `
if (typeof window !== "undefined") {}
`,
			snapshot: `
if (typeof window !== "undefined") {}
           ~~~~~~
           Prefer the standard \`globalThis\` over the platform-specific \`window\` for accessing the global object.
`,
		},
	],
	valid: [
		`const value = globalThis.localStorage;`,
		`function handler() {}
globalThis.addEventListener("load", handler);`,
		`function example(window: { inner: boolean }) { console.log(window); }`,
		`function example(window: Window) { return window.innerWidth; }`,
		`const object = { window: true };`,
		`function example(config: { window: boolean }) {
    const { window } = config;
    return window;
}`,
		`class Example { window = true; }`,
		`interface Config { window: boolean; }`,
		`const object = { window: true };
const value = object.window;`,
	],
});
