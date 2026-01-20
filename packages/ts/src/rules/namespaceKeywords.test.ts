import rule from "./namespaceKeywords.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
module Values {}
`,
			output: `
namespace Values {}
`,
			snapshot: `
module Values {}
~~~~~~
The \`namespace\` keyword is preferred over \`module\` for TypeScript namespaces.
`,
		},
		{
			code: `
declare module Values {}
`,
			output: `
declare namespace Values {}
`,
			snapshot: `
declare module Values {}
        ~~~~~~
        The \`namespace\` keyword is preferred over \`module\` for TypeScript namespaces.
`,
		},
		{
			code: `
module Outer {
    export module Inner {}
}
`,
			output: `
namespace Outer {
    export namespace Inner {}
}
`,
			snapshot: `
module Outer {
~~~~~~
The \`namespace\` keyword is preferred over \`module\` for TypeScript namespaces.
    export module Inner {}
           ~~~~~~
           The \`namespace\` keyword is preferred over \`module\` for TypeScript namespaces.
}
`,
		},
		{
			code: `
export module Values {}
`,
			output: `
export namespace Values {}
`,
			snapshot: `
export module Values {}
       ~~~~~~
       The \`namespace\` keyword is preferred over \`module\` for TypeScript namespaces.
`,
		},
	],
	valid: [
		`namespace Values {}`,
		`declare namespace Values {}`,
		`export namespace Values {}`,
		`module "external-module" {}`,
		`declare module "external-module" {}`,
		`module 'single-quoted' {}`,
		`
declare module "external" {
    namespace Inner {}
}
`,
		`
namespace Outer {
    namespace Inner {}
}
`,
	],
});
