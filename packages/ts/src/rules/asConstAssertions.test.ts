import rule from "./asConstAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value: 2 = 2;
`,
			snapshot: `
let value: 2 = 2;
           ~
           Prefer \`as const\` over a literal type annotation.
`,
		},
		{
			code: `
let value: "hello" = "hello";
`,
			snapshot: `
let value: "hello" = "hello";
           ~~~~~~~
           Prefer \`as const\` over a literal type annotation.
`,
		},
		{
			code: `
let value = "hello" as "hello";
`,
			snapshot: `
let value = "hello" as "hello";
                       ~~~~~~~
                       Prefer \`as const\` over an explicit literal type assertion.
`,
		},

		{
			code: `
let value = 42 as 42;
`,
			snapshot: `
let value = 42 as 42;
                  ~~
                  Prefer \`as const\` over an explicit literal type assertion.
`,
		},
		{
			code: `
const value: true = true;
`,
			snapshot: `
const value: true = true;
             ~~~~
             Prefer \`as const\` over a literal type annotation.
`,
		},
	],
	valid: [
		`let value = "hello";`,
		`let value = "hello" as const;`,
		`let value: "hello" = "hello" as const;`,
		`let value = "hello" as string;`,
		`let value = <string>"hello";`,
		`let value: string = "hello";`,
		`let value = 42;`,
		`const object = { key: "value" };`,
	],
});
