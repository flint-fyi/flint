import rule from "./namespaceImplicitAmbientImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare namespace Values { type Value = 1; }
`,
			snapshot: `
declare namespace Values { type Value = 1; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
		{
			code: `
declare namespace Values { type Value = 1; export type Other = 2; }
`,
			snapshot: `
declare namespace Values { type Value = 1; export type Other = 2; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
		{
			code: `
declare namespace Values { interface Value {} }
`,
			snapshot: `
declare namespace Values { interface Value {} }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
		{
			code: `
declare namespace Values { class Value {} }
`,
			snapshot: `
declare namespace Values { class Value {} }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
		{
			code: `
declare namespace Values { enum Value { A } }
`,
			snapshot: `
declare namespace Values { enum Value { A } }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
		{
			code: `
declare namespace Values { function getValue(): number; }
`,
			snapshot: `
declare namespace Values { function getValue(): number; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
		{
			code: `
declare namespace Values { const value: number; }
`,
			snapshot: `
declare namespace Values { const value: number; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
		{
			code: `
declare namespace Outer { namespace Inner {} }
`,
			snapshot: `
declare namespace Outer { namespace Inner {} }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Declared namespaces without explicit exports implicitly export all members.
`,
		},
	],
	valid: [
		`namespace Values { type Value = 1; const CONSTANT = 1; }`,
		`namespace Empty {}`,
		`declare namespace Values { export type Value = 1; }`,
		`declare namespace Values { export {}; type Value = 1; }`,
		`declare namespace Values { type Value = 1; type Other = 2; export { Other }; }`,
		`declare namespace Empty {}`,
		{
			code: `declare namespace Values { export type Value = 1; }`,
			fileName: "file.d.ts",
		},
		{
			code: `declare namespace Values { export {}; type Value = 1; }`,
			fileName: "file.d.ts",
		},
		{
			code: `declare namespace Values { export {}; type Value = 1; export type Other = 2; }`,
			fileName: "file.d.ts",
		},
		{
			code: `declare namespace Empty {}`,
			fileName: "file.d.ts",
		},
	],
});
