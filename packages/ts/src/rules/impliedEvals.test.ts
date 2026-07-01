import rule from "./impliedEvals.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
setTimeout("code", 0);
`,
			// only: true,
			snapshot: `
setTimeout("code", 0);
           ~~~~~~
           Avoid passing unsafe strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `
setInterval("code", 0);
`,
			snapshot: `
setInterval("code", 0);
            ~~~~~~
            Avoid passing unsafe strings to setInterval; pass a function instead.
`,
		},
		{
			code: `
setImmediate("code");
`,
			files: {
				"lib.node.d.ts": `
declare function setImmediate(handler: string | (() => void)): number;
`,
			},
			snapshot: `
setImmediate("code");
             ~~~~~~
             Avoid passing unsafe strings to setImmediate; pass a function instead.
`,
		},
		{
			code: `
execScript("code");
`,
			files: {
				"lib.custom.d.ts": `
declare function execScript(code: string): void;
`,
			},
			snapshot: `
execScript("code");
           ~~~~~~
           Avoid passing unsafe strings to execScript; pass a function instead.
`,
		},
		{
			code: `
window.setTimeout("code", 0);
`,
			snapshot: `
window.setTimeout("code", 0);
                  ~~~~~~
                  Avoid passing unsafe strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `
globalThis.setInterval("code", 0);
`,
			snapshot: `
globalThis.setInterval("code", 0);
                       ~~~~~~
                       Avoid passing unsafe strings to setInterval; pass a function instead.
`,
		},
		{
			code: `
window["setTimeout"]("code", 0);
`,
			snapshot: `
window["setTimeout"]("code", 0);
                     ~~~~~~
                     Avoid passing unsafe strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `
const code = "alert('hi');";
setTimeout(code, 100);
`,
			snapshot: `
const code = "alert('hi');";
setTimeout(code, 100);
           ~~~~
           Avoid passing unsafe strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `
setTimeout(\`code\`, 100);
`,
			snapshot: `
setTimeout(\`code\`, 100);
           ~~~~~~
           Avoid passing unsafe strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `
const template = \`code\`;
setInterval(template, 1000);
`,
			snapshot: `
const template = \`code\`;
setInterval(template, 1000);
            ~~~~~~~~
            Avoid passing unsafe strings to setInterval; pass a function instead.
`,
		},
		{
			code: `
new Function("return 1 + 1");
`,
			snapshot: `
new Function("return 1 + 1");
    ~~~~~~~~
    Avoid using the unsafe Function constructor to create functions.
`,
		},
		{
			code: `
Function("return 1 + 1");
`,
			snapshot: `
Function("return 1 + 1");
~~~~~~~~
Avoid using the unsafe Function constructor to create functions.
`,
		},
		{
			code: `
new Function("a", "b", "return a + b");
`,
			snapshot: `
new Function("a", "b", "return a + b");
    ~~~~~~~~
    Avoid using the unsafe Function constructor to create functions.
`,
		},
		{
			code: `
const getCode = (): string => "code";
setTimeout(getCode(), 0);
`,
			snapshot: `
const getCode = (): string => "code";
setTimeout(getCode(), 0);
           ~~~~~~~~~
           Avoid passing unsafe strings to setTimeout; pass a function instead.
`,
		},
	],
	valid: [
		`
declare function setTimeout(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
setTimeout(() => {}, 100);
`,
		`
declare function setInterval(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
setInterval(function() {}, 1000);
`,
		`
declare function setImmediate(handler: string | ((...args: unknown[]) => void)): number;
setImmediate(() => {});
`,
		`
declare function setTimeout(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
declare const callback: () => void;
setTimeout(callback, 100);
`,
		`
declare function setInterval(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
declare function someFunction(): void;
setInterval(someFunction, 1000);
`,
		`
declare function setTimeout(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
const fn = () => {};
setTimeout(fn, 100);
`,
		`
declare function setTimeout(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
declare const fn: { bind: (ctx: unknown) => () => void };
setTimeout(fn.bind(this), 100);
`,
		`
window.setTimeout(() => {}, 100);
`,
		`
declare const callback: () => void;
globalThis.setInterval(callback, 1000);
`,
		`
declare function setTimeout(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
declare function getCallback(): () => void;
setTimeout(getCallback(), 100);
`,
		`
declare function setTimeout(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
const getCallback = (): (() => void) => () => {};
setTimeout(getCallback(), 100);
`,
		`
function setTimeout(input: string, value: number) {}
setTimeout("", 0);
`,
		`
function setInterval(input: string, value: number) {}
setInterval("", 0);
`,
		`
new Function();
`,
	],
});
