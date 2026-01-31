import { ruleTester } from "./ruleTester.ts";
import rule from "./topLevelAwaits.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export const config = await import("./config.json");
`,
			snapshot: `
export const config = await import("./config.json");
                      ~~~~~~
                      Top-level await in a module file causes imports from the module to wait on the asynchronous work.
`,
		},
		{
			code: `
await import("./config.json");
export const config = 1;
`,
			snapshot: `
await import("./config.json");
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
export const config = 1;
`,
		},
		{
			code: `
export const config = 1;
await import("./config.json");
`,
			snapshot: `
export const config = 1;
await import("./config.json");
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
`,
		},
		{
			code: `
const response = await fetch("/api");
const json = await response.json();
export { json };
`,
			snapshot: `
const response = await fetch("/api");
                 ~~~~~~
                 Top-level await in a module file causes imports from the module to wait on the asynchronous work.
const json = await response.json();
             ~~~~~~
             Top-level await in a module file causes imports from the module to wait on the asynchronous work.
export { json };
`,
		},
		{
			code: `
await setup();
export default class App {}
`,
			snapshot: `
await setup();
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
export default class App {}
`,
		},
		{
			code: `
await init();
export function run() {}
`,
			snapshot: `
await init();
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
export function run() {}
`,
		},
		{
			code: `
import { dep } from "./dep";
await dep();
export const result = 1;
`,
			snapshot: `
import { dep } from "./dep";
await dep();
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
export const result = 1;
`,
		},
		{
			code: `
export {};
await doSomething();
`,
			snapshot: `
export {};
await doSomething();
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
`,
		},
		{
			code: `
{
    await inBlock();
}
export const x = 1;
`,
			snapshot: `
{
    await inBlock();
    ~~~~~~
    Top-level await in a module file causes imports from the module to wait on the asynchronous work.
}
export const x = 1;
`,
		},
		{
			code: `
if (true) {
    await inIf();
}
export const x = 1;
`,
			snapshot: `
if (true) {
    await inIf();
    ~~~~~~
    Top-level await in a module file causes imports from the module to wait on the asynchronous work.
}
export const x = 1;
`,
		},
		{
			code: `
for (const x of items) {
    await process(x);
}
export const done = true;
`,
			snapshot: `
for (const x of items) {
    await process(x);
    ~~~~~~
    Top-level await in a module file causes imports from the module to wait on the asynchronous work.
}
export const done = true;
`,
		},
		{
			code: `
try {
    await riskyOperation();
} catch {}
export const handled = true;
`,
			snapshot: `
try {
    await riskyOperation();
    ~~~~~~
    Top-level await in a module file causes imports from the module to wait on the asynchronous work.
} catch {}
export const handled = true;
`,
		},
	],
	valid: [
		`async function load() { await fetch("/api"); }`,
		`const load = async () => { await fetch("/api"); };`,
		`class Service { async fetch() { await this.getData(); } }`,
		`export async function getData() { return await fetch("/api"); }`,
		`const obj = { async method() { await fetch("/api"); } };`,
		`await fetch("https://api.example.com");`,
		`const data = await loadData();`,
		`const response = await fetch("/api"); const json = await response.json();`,
		`import { dep } from "./dep"; await dep();`,
		`{ await inBlock(); }`,
		`if (true) { await inCondition(); }`,
		`for (const x of [1,2,3]) { await process(x); }`,
		`try { await risky(); } catch {}`,
		`while (condition) { await poll(); }`,
		`
const config = await import("./config.json");
console.log(config);
`,
		`
import { setup } from "./setup";
await setup();
console.log("Done");
`,
	],
});
