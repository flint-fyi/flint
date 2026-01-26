import { ruleTester } from "./ruleTester.ts";
import rule from "./templateExpressionValues.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const msg = \`value: \${{ a: 1 }}\`;
`,
			snapshot: `
const msg = \`value: \${{ a: 1 }}\`;
                      ~~~~~~~~
                      Object expressions in template literals produce \`[object Object]\`.
`,
		},
		{
			code: `
const msg = \`items: \${[1, 2, 3]}\`;
`,
			snapshot: `
const msg = \`items: \${[1, 2, 3]}\`;
                      ~~~~~~~~~
                      Array expressions in template literals may produce unexpected output.
`,
		},
		{
			code: `
const msg = \`callback: \${() => {}}\`;
`,
			snapshot: `
const msg = \`callback: \${() => {}}\`;
                         ~~~~~~~~
                         Function expressions in template literals produce the function source code.
`,
		},
		{
			code: `
const msg = \`fn: \${function() {}}\`;
`,
			snapshot: `
const msg = \`fn: \${function() {}}\`;
                   ~~~~~~~~~~~~~
                   Function expressions in template literals produce the function source code.
`,
		},
		{
			code: `
const obj = { name: "test" };
const msg = \`data: \${obj}\`;
`,
			snapshot: `
const obj = { name: "test" };
const msg = \`data: \${obj}\`;
                     ~~~
                     Object expressions in template literals produce \`[object Object]\`.
`,
		},
	],
	valid: [
		"const msg = `value: ${123}`;",
		'const msg = `value: ${"string"}`;',
		"const msg = `value: ${true}`;",
		"const msg = `value: ${null}`;",
		"const msg = `value: ${undefined}`;",
		'const someString = "test"; const msg = `value: ${someString}`;',
		"const error = new Error(); const msg = `error: ${error}`;",
		"const date = new Date(); const msg = `date: ${date}`;",
		"const regex = /test/; const msg = `regex: ${regex}`;",
		"const fn = () => 1; const msg = `result: ${fn()}`;",
		'const tag = (s: TemplateStringsArray, ...v: unknown[]) => ""; const msg = tag`value: ${{ a: 1 }}`;',
	],
});
