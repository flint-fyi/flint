import rule from "./literalConstructorWrappers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = BigInt(123);
`,
			snapshot: `
const value = BigInt(123);
              ~~~~~~
              Prefer literal syntax over \`BigInt()\` for creating primitive values.
`,
		},
		{
			code: `
const value = BigInt(0);
`,
			snapshot: `
const value = BigInt(0);
              ~~~~~~
              Prefer literal syntax over \`BigInt()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Boolean(true);
`,
			snapshot: `
const value = Boolean(true);
              ~~~~~~~
              Prefer literal syntax over \`Boolean()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Boolean(false);
`,
			snapshot: `
const value = Boolean(false);
              ~~~~~~~
              Prefer literal syntax over \`Boolean()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Boolean("text");
`,
			snapshot: `
const value = Boolean("text");
              ~~~~~~~
              Prefer literal syntax over \`Boolean()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Boolean(123);
`,
			snapshot: `
const value = Boolean(123);
              ~~~~~~~
              Prefer literal syntax over \`Boolean()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Number("123");
`,
			snapshot: `
const value = Number("123");
              ~~~~~~
              Prefer literal syntax over \`Number()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Number("0");
`,
			snapshot: `
const value = Number("0");
              ~~~~~~
              Prefer literal syntax over \`Number()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Number("-42");
`,
			snapshot: `
const value = Number("-42");
              ~~~~~~
              Prefer literal syntax over \`Number()\` for creating primitive values.
`,
		},
		{
			code: `
const value = Number("3.14");
`,
			snapshot: `
const value = Number("3.14");
              ~~~~~~
              Prefer literal syntax over \`Number()\` for creating primitive values.
`,
		},
		{
			code: `
const value = String(123);
`,
			snapshot: `
const value = String(123);
              ~~~~~~
              Prefer literal syntax over \`String()\` for creating primitive values.
`,
		},
		{
			code: `
const value = String(true);
`,
			snapshot: `
const value = String(true);
              ~~~~~~
              Prefer literal syntax over \`String()\` for creating primitive values.
`,
		},
		{
			code: `
const value = String(false);
`,
			snapshot: `
const value = String(false);
              ~~~~~~
              Prefer literal syntax over \`String()\` for creating primitive values.
`,
		},
		{
			code: `
const value = String(123n);
`,
			snapshot: `
const value = String(123n);
              ~~~~~~
              Prefer literal syntax over \`String()\` for creating primitive values.
`,
		},
	],
	valid: [
		"const value = 123n;",
		"const value = BigInt(variable);",
		"const value = BigInt('123');",
		"const value = BigInt(1.5);",
		"const value = !!variable;",
		"const value = Boolean(variable);",
		"const value = 123;",
		"const value = Number(variable);",
		"const value = Number('not a number');",
		"const value = Number('');",
		"const value = Number('Infinity');",
		"const value = 'text';",
		"const value = String(variable);",
		"const value = String('already a string');",
		"const value = `${123}`;",
		"const CustomBigInt = () => 0n; CustomBigInt(123);",
		"function test(Boolean: (value: boolean) => boolean) { Boolean(true); }",
	],
});
