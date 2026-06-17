import rule from "./numberStaticMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1;

isNaN(value);
`,
			snapshot: `
const value = 1;

isNaN(value);
~~~~~
Prefer the more precise \`Number.isNaN\` over the legacy global \`isNaN\`.
`,
			suggestions: [
				{
					id: "replaceWithNumberMethod",
					updated: `
const value = 1;

Number.isNaN(value);
`,
				},
			],
		},
		{
			code: `
const value = 1;

isFinite(value);
`,
			snapshot: `
const value = 1;

isFinite(value);
~~~~~~~~
Prefer the more precise \`Number.isFinite\` over the legacy global \`isFinite\`.
`,
			suggestions: [
				{
					id: "replaceWithNumberMethod",
					updated: `
const value = 1;

Number.isFinite(value);
`,
				},
			],
		},
		{
			code: `
const result = 1;

if (isNaN(result)) {}
`,
			snapshot: `
const result = 1;

if (isNaN(result)) {}
    ~~~~~
    Prefer the more precise \`Number.isNaN\` over the legacy global \`isNaN\`.
`,
			suggestions: [
				{
					id: "replaceWithNumberMethod",
					updated: `
const result = 1;

if (Number.isNaN(result)) {}
`,
				},
			],
		},
	],
	valid: [
		`parseInt("10");`,
		`parseFloat("10.5");`,
		`NaN;`,
		`const value = NaN;`,
		`Number.parseInt("10");`,
		`Number.parseFloat("10.5");`,
		`const value = 1;
Number.isNaN(value);`,
		`const value = 1;
Number.isFinite(value);`,
		`Number.NaN;`,
		`function test() {
    const isNaN = (value: unknown) => typeof value === "number" && value !== value;
    return isNaN(1);
}`,
		`function parseInt(value: string) { return value; }`,
		`const obj = { isNaN: true };`,
		`function test(config: { isNaN: boolean }) {
    const { isNaN } = config;
    return isNaN;
}`,
		`interface Config { isNaN: boolean; }`,
		`const obj = { isNaN: true };
const value = obj.isNaN;`,
		`class Example { isNaN = true; }`,
		`const obj = { NaN: 0 };`,
		`function example(isNaN: boolean) { return isNaN; }`,
		`const object = { parseInt };`,
	],
});
