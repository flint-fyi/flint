import rule from "./namespaceDeclarations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
namespace name {}
`,
			snapshot: `
namespace name {}
~~~~~~~~~
Prefer using ECMAScript modules over legacy TypeScript namespaces.
`,
		},
	],
	valid: [
		`declare global {}`,
		`declare module 'name' {}`,
		{
			code: `declare module name {}`,
			options: { allowDeclarations: true },
		},
		{
			code: `declare namespace name {}`,
			options: { allowDeclarations: true },
		},
		{
			code: `
declare namespace outer {
    namespace inner {}
}`,
			options: { allowDeclarations: true },
		},
		{
			code: `namespace name {}`,
			fileName: "file.d.ts",
			options: { allowDefinitionFiles: true },
		},
	],
});
