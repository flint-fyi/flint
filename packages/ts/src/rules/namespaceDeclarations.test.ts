import rule from "./namespaceDeclarations.ts";
import { scriptRuleTester } from "./ruleTester.ts";

scriptRuleTester.describe(rule, {
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
		{
			code: `
export namespace name {}
`,
			snapshot: `
export namespace name {}
~~~~~~
Prefer using ECMAScript modules over legacy TypeScript namespaces.
`,
		},
		{
			code: `
declare namespace name {}
`,
			snapshot: `
declare namespace name {}
~~~~~~~
Prefer using ECMAScript modules over legacy TypeScript namespaces.
`,
		},
		{
			code: `
namespace outer {
    namespace inner {}
}
`,
			snapshot: `
namespace outer {
~~~~~~~~~
Prefer using ECMAScript modules over legacy TypeScript namespaces.
    namespace inner {}
}
`,
		},
		{
			code: `
namespace A.B.C {}
`,
			snapshot: `
namespace A.B.C {}
~~~~~~~~~
Prefer using ECMAScript modules over legacy TypeScript namespaces.
`,
		},
	],
	valid: [
		`
export {};

declare global {}
`,
		`declare module 'name' {}`,
		`declare module "name" {}`,
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
			code: `
declare module 'express' {
    namespace inner {}
}`,
			options: { allowDeclarations: true },
		},
		{
			code: `
export {};

declare global {
    namespace inner {}
}`,
			options: { allowDeclarations: true },
		},
		{
			code: `declare namespace name {}`,
			fileName: "file.d.ts",
			options: { allowDefinitionFiles: true },
		},
	],
});
