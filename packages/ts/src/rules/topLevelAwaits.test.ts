import rule from "./topLevelAwaits.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
await fetch("https://api.example.com");
`,
			snapshot: `
await fetch("https://api.example.com");
~~~~~~
Top-level await can block module loading.
`,
		},
		{
			code: `
const data = await loadData();
`,
			snapshot: `
const data = await loadData();
             ~~~~~~
             Top-level await can block module loading.
`,
		},
		{
			code: `
export const config = await import("./config.json");
`,
			snapshot: `
export const config = await import("./config.json");
                      ~~~~~~
                      Top-level await can block module loading.
`,
		},
		{
			code: `
const response = await fetch("/api");
const json = await response.json();
`,
			snapshot: `
const response = await fetch("/api");
                 ~~~~~~
                 Top-level await can block module loading.
const json = await response.json();
             ~~~~~~
             Top-level await can block module loading.
`,
		},
	],
	valid: [
		`async function load() { await fetch("/api"); }`,
		`const load = async () => { await fetch("/api"); };`,
		`class Service { async fetch() { await this.getData(); } }`,
		`export async function getData() { return await fetch("/api"); }`,
		`const obj = { async method() { await fetch("/api"); } };`,
	],
});
