import rule from "./numberStaticMethods.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
parseInt("10");
`,
			snapshot: `
parseInt("10");
~~~~~~~~
Prefer \`Number.parseInt\` over the global \`parseInt\` for clarity and consistency.
`,
		},
		{
			code: `
parseFloat("10.5");
`,
			snapshot: `
parseFloat("10.5");
~~~~~~~~~~
Prefer \`Number.parseFloat\` over the global \`parseFloat\` for clarity and consistency.
`,
		},
		{
			code: `
isNaN(value);
`,
			snapshot: `
isNaN(value);
~~~~~
Prefer \`Number.isNaN\` over the global \`isNaN\` for clarity and consistency.
`,
		},
		{
			code: `
isFinite(value);
`,
			snapshot: `
isFinite(value);
~~~~~~~~
Prefer \`Number.isFinite\` over the global \`isFinite\` for clarity and consistency.
`,
		},
		{
			code: `
const value = NaN;
`,
			snapshot: `
const value = NaN;
              ~~~
              Prefer \`Number.NaN\` over the global \`NaN\` for clarity and consistency.
`,
		},
		{
			code: `
const value = Infinity;
`,
			snapshot: `
const value = Infinity;
              ~~~~~~~~
              Prefer \`Number.POSITIVE_INFINITY\` over the global \`Infinity\` for clarity and consistency.
`,
		},
		{
			code: `
const value = -Infinity;
`,
			snapshot: `
const value = -Infinity;
              ~~~~~~~~~
              Prefer \`Number.NEGATIVE_INFINITY\` over the global \`Infinity\` for clarity and consistency.
`,
		},
		{
			code: `
if (isNaN(result)) {}
`,
			snapshot: `
if (isNaN(result)) {}
    ~~~~~
    Prefer \`Number.isNaN\` over the global \`isNaN\` for clarity and consistency.
`,
		},
		{
			code: `
const result = parseInt("42", 10);
`,
			snapshot: `
const result = parseInt("42", 10);
               ~~~~~~~~
               Prefer \`Number.parseInt\` over the global \`parseInt\` for clarity and consistency.
`,
		},
		{
			code: `
console.log(NaN);
`,
			snapshot: `
console.log(NaN);
            ~~~
            Prefer \`Number.NaN\` over the global \`NaN\` for clarity and consistency.
`,
		},
		{
			code: `
const positive = Infinity;
const negative = -Infinity;
`,
			snapshot: `
const positive = Infinity;
                 ~~~~~~~~
                 Prefer \`Number.POSITIVE_INFINITY\` over the global \`Infinity\` for clarity and consistency.
const negative = -Infinity;
                 ~~~~~~~~~
                 Prefer \`Number.NEGATIVE_INFINITY\` over the global \`Infinity\` for clarity and consistency.
`,
		},
		{
			code: `
typeof isNaN;
`,
			snapshot: `
typeof isNaN;
       ~~~~~
       Prefer \`Number.isNaN\` over the global \`isNaN\` for clarity and consistency.
`,
		},
		{
			code: `
const check = value === NaN;
`,
			snapshot: `
const check = value === NaN;
                        ~~~
                        Prefer \`Number.NaN\` over the global \`NaN\` for clarity and consistency.
`,
		},
		{
			code: `
const value = +Infinity;
`,
			snapshot: `
const value = +Infinity;
               ~~~~~~~~
               Prefer \`Number.POSITIVE_INFINITY\` over the global \`Infinity\` for clarity and consistency.
`,
		},
		{
			code: `
const ref = parseInt;
`,
			snapshot: `
const ref = parseInt;
            ~~~~~~~~
            Prefer \`Number.parseInt\` over the global \`parseInt\` for clarity and consistency.
`,
		},
		{
			code: `
[1, 2, "3"].map(parseInt);
`,
			snapshot: `
[1, 2, "3"].map(parseInt);
                ~~~~~~~~
                Prefer \`Number.parseInt\` over the global \`parseInt\` for clarity and consistency.
`,
		},
	],
	valid: [
		`Number.parseInt("10");`,
		`Number.parseFloat("10.5");`,
		`Number.isNaN(value);`,
		`Number.isFinite(value);`,
		`Number.NaN;`,
		`Number.POSITIVE_INFINITY;`,
		`Number.NEGATIVE_INFINITY;`,
		`const isNaN = (value: unknown) => typeof value === "number" && value !== value;`,
		`function parseInt(value: string) { return value; }`,
		`const obj = { isNaN: true };`,
		`const { isNaN } = config;`,
		`interface Config { isNaN: boolean; }`,
		`const value = obj.isNaN;`,
		`class Example { isNaN = true; }`,
		`const obj = { NaN: 0 };`,
		`const value = config.Infinity;`,
		`function example(isNaN: boolean) { return isNaN; }`,
		`const parseFloat = 42;`,
		`const object = { parseInt };`,
	],
});
