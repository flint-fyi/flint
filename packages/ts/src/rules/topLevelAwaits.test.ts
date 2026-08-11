import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./topLevelAwaits.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export const config = await import("./config.json");
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
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
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
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
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
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
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
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
async function setup() {}
await setup();
export default class App {}
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
			snapshot: `
async function setup() {}
await setup();
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
export default class App {}
`,
		},
		{
			code: `
async function init() {}
await init();
export function run() {}
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
			snapshot: `
async function init() {}
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
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
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
async function doSomething() {}
export {};
await doSomething();
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
			snapshot: `
async function doSomething() {}
export {};
await doSomething();
~~~~~~
Top-level await in a module file causes imports from the module to wait on the asynchronous work.
`,
		},
		{
			code: `
async function inBlock() {}
{
    await inBlock();
}
export const x = 1;
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
			snapshot: `
async function inBlock() {}
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
async function inIf() {}
if (true) {
    await inIf();
}
export const x = 1;
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
			snapshot: `
async function inIf() {}
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
const items = [1, 2, 3];
async function process(value: number) {}
for (const x of items) {
    await process(x);
}
export const done = true;
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
			snapshot: `
const items = [1, 2, 3];
async function process(value: number) {}
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
async function riskyOperation() {}
try {
    await riskyOperation();
} catch {}
export const handled = true;
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
			snapshot: `
async function riskyOperation() {}
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
		{
			code: `async function load() { await fetch("/api"); }`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `const load = async () => { await fetch("/api"); };`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `class Service { async getData() {} async fetch() { await this.getData(); } }`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `export async function getData() { return await fetch("/api"); }`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `const obj = { async method() { await fetch("/api"); } };`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `await fetch("https://api.example.com");`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
async function loadData() {}
const data = await loadData();
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `const response = await fetch("/api"); const json = await response.json();`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `import { dep } from "./dep"; await dep();`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
async function inBlock() {}
{ await inBlock(); }
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
async function inCondition() {}
if (true) { await inCondition(); }
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
async function process(value: number) {}
for (const x of [1, 2, 3]) { await process(x); }
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
async function risky() {}
try { await risky(); } catch {}
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
let condition = false;
async function poll() {}
while (condition) { await poll(); }
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
const config = await import("./config.json");
console.log(config);
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
		{
			code: `
import { setup } from "./setup";
await setup();
console.log("Done");
`,
			files: {
				"config.json": `{
    "enabled": true
}`,
				"dep.ts": `export async function dep() {}`,
				"setup.ts": `export async function setup() {}`,
				...createRuleTesterTSConfig({
					lib: ["esnext", "DOM"],
					module: "esnext",
					moduleDetection: "force",
					resolveJsonModule: true,
				}),
			},
		},
	],
});
