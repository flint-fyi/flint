import rule from "./numberStaticMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
isNaN(value);
`,
			snapshot: `
isNaN(value);
~~~~~
Prefer the more precise \`Number.isNaN\` over the legacy global \`isNaN\`.
`,
			suggestions: [
				{
					id: "replaceWithNumberMethod",
					updated: `
Number.isNaN(value);
`,
				},
			],
		},
		{
			code: `
isFinite(value);
`,
			snapshot: `
isFinite(value);
~~~~~~~~
Prefer the more precise \`Number.isFinite\` over the legacy global \`isFinite\`.
`,
			suggestions: [
				{
					id: "replaceWithNumberMethod",
					updated: `
Number.isFinite(value);
`,
				},
			],
		},
		{
			code: `
if (isNaN(result)) {}
`,
			snapshot: `
if (isNaN(result)) {}
    ~~~~~
    Prefer the more precise \`Number.isNaN\` over the legacy global \`isNaN\`.
`,
			suggestions: [
				{
					id: "replaceWithNumberMethod",
					updated: `
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
		`console.log(NaN);`,
		`value === NaN;`,
		`Number.parseInt("10");`,
		`Number.parseFloat("10.5");`,
		`Number.isNaN(value);`,
		`Number.isFinite(value);`,
		`Number.NaN;`,
		`const isNaN = (value: unknown) => typeof value === "number" && value !== value;`,
		`function parseInt(value: string) { return value; }`,
		`const obj = { isNaN: true };`,
		`const { isNaN } = config;`,
		`interface Config { isNaN: boolean; }`,
		`const value = obj.isNaN;`,
		`class Example { isNaN = true; }`,
		`const obj = { NaN: 0 };`,
		`function example(isNaN: boolean) { return isNaN; }`,
		`const object = { parseInt };`,
	],
});
