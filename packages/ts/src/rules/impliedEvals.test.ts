import rule from "./impliedEvals.ts";
import { ruleTester } from "./ruleTester.ts";

const globalDeclarations = `
declare function setTimeout(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
declare function setInterval(handler: string | ((...args: unknown[]) => void), timeout?: number): number;
declare function setImmediate(handler: string | ((...args: unknown[]) => void)): number;
declare function execScript(code: string): void;
declare var window: { setTimeout: typeof setTimeout; setInterval: typeof setInterval };
declare var globalThis: { setTimeout: typeof setTimeout; setInterval: typeof setInterval };
export {};
`;

ruleTester.describe(rule, {
	invalid: [
		{
			code: `${globalDeclarations}
setTimeout("code", 0);
`,
			snapshot: `${globalDeclarations}
setTimeout("code", 0);
           ~~~~~~
           Avoid passing strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
setInterval("code", 0);
`,
			snapshot: `${globalDeclarations}
setInterval("code", 0);
            ~~~~~~
            Avoid passing strings to setInterval; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
setImmediate("code");
`,
			snapshot: `${globalDeclarations}
setImmediate("code");
             ~~~~~~
             Avoid passing strings to setImmediate; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
execScript("code");
`,
			snapshot: `${globalDeclarations}
execScript("code");
           ~~~~~~
           Avoid passing strings to execScript; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
window.setTimeout("code", 0);
`,
			snapshot: `${globalDeclarations}
window.setTimeout("code", 0);
                  ~~~~~~
                  Avoid passing strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
globalThis.setInterval("code", 0);
`,
			snapshot: `${globalDeclarations}
globalThis.setInterval("code", 0);
                       ~~~~~~
                       Avoid passing strings to setInterval; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
window["setTimeout"]("code", 0);
`,
			snapshot: `${globalDeclarations}
window["setTimeout"]("code", 0);
                     ~~~~~~
                     Avoid passing strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
const code = "alert('hi');";
setTimeout(code, 100);
`,
			snapshot: `${globalDeclarations}
const code = "alert('hi');";
setTimeout(code, 100);
           ~~~~
           Avoid passing strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
setTimeout(\`code\`, 100);
`,
			snapshot: `${globalDeclarations}
setTimeout(\`code\`, 100);
           ~~~~~~
           Avoid passing strings to setTimeout; pass a function instead.
`,
		},
		{
			code: `${globalDeclarations}
const template = \`code\`;
setInterval(template, 1000);
`,
			snapshot: `${globalDeclarations}
const template = \`code\`;
setInterval(template, 1000);
            ~~~~~~~~
            Avoid passing strings to setInterval; pass a function instead.
`,
		},
		{
			code: `
new Function("return 1 + 1");
export {};
`,
			snapshot: `
new Function("return 1 + 1");
    ~~~~~~~~
    Avoid using the Function constructor to create functions.
export {};
`,
		},
		{
			code: `
Function("return 1 + 1");
export {};
`,
			snapshot: `
Function("return 1 + 1");
~~~~~~~~
Avoid using the Function constructor to create functions.
export {};
`,
		},
		{
			code: `
new Function("a", "b", "return a + b");
export {};
`,
			snapshot: `
new Function("a", "b", "return a + b");
    ~~~~~~~~
    Avoid using the Function constructor to create functions.
export {};
`,
		},
		{
			code: `${globalDeclarations}
const getCode = (): string => "code";
setTimeout(getCode(), 0);
`,
			snapshot: `${globalDeclarations}
const getCode = (): string => "code";
setTimeout(getCode(), 0);
           ~~~~~~~~~
           Avoid passing strings to setTimeout; pass a function instead.
`,
		},
	],
	valid: [
		`${globalDeclarations}setTimeout(() => {}, 100);`,
		`${globalDeclarations}setInterval(function() {}, 1000);`,
		`${globalDeclarations}setImmediate(() => {});`,
		`${globalDeclarations}declare const callback: () => void; setTimeout(callback, 100);`,
		`${globalDeclarations}declare function someFunction(): void; setInterval(someFunction, 1000);`,
		`${globalDeclarations}const fn = () => {}; setTimeout(fn, 100);`,
		`${globalDeclarations}declare const fn: { bind: (ctx: unknown) => () => void }; setTimeout(fn.bind(this), 100);`,
		`${globalDeclarations}window.setTimeout(() => {}, 100);`,
		`${globalDeclarations}declare const callback: () => void; globalThis.setInterval(callback, 1000);`,
		`${globalDeclarations}declare function getCallback(): () => void; setTimeout(getCallback(), 100);`,
		`${globalDeclarations}const getCallback = (): (() => void) => () => {}; setTimeout(getCallback(), 100);`,
		`
function setTimeout(input: string, value: number) {}
setTimeout("", 0);
export {};
`,
		`
function setInterval(input: string, value: number) {}
setInterval("", 0);
export {};
`,
		`new Function(); export {};`,
	],
});
