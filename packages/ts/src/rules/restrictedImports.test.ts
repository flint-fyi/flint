import rule from "./restrictedImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import foo from "forbidden";
`,
			options: {
				paths: ["forbidden"],
			},
			snapshot: `
import foo from "forbidden";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'forbidden' import is restricted from being used.
`,
		},
		{
			code: `
import foo from "forbidden";
`,
			options: {
				paths: [
					{
						message: "Use 'allowed-mod' instead.",
						name: "forbidden",
					},
				],
			},
			snapshot: `
import foo from "forbidden";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'forbidden' import is restricted from being used. Use 'allowed-mod' instead.
`,
		},
		{
			code: `
import { badExport } from "mod";
`,
			options: {
				paths: [
					{
						importNames: ["badExport"],
						name: "mod",
					},
				],
			},
			snapshot: `
import { badExport } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'badExport' import from 'mod' is restricted.
`,
		},
		{
			code: `
import foo from "mod";
`,
			options: {
				paths: [
					{
						importNames: ["default"],
						name: "mod",
					},
				],
			},
			snapshot: `
import foo from "mod";
~~~~~~~~~~~~~~~~~~~~~~
'default' import from 'mod' is restricted.
`,
		},
		{
			code: `
import * as ns from "mod";
`,
			options: {
				paths: [
					{
						importNames: ["badExport"],
						name: "mod",
					},
				],
			},
			snapshot: `
import * as ns from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~
* import is invalid because 'badExport' from 'mod' is restricted.
`,
		},
		{
			code: `
import "forbidden";
`,
			options: {
				paths: ["forbidden"],
			},
			snapshot: `
import "forbidden";
~~~~~~~~~~~~~~~~~~~
'forbidden' import is restricted from being used.
`,
		},
		{
			code: `
import { notAllowed } from "mod";
`,
			options: {
				paths: [
					{
						allowImportNames: ["allowed"],
						name: "mod",
					},
				],
			},
			snapshot: `
import { notAllowed } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'notAllowed' import from 'mod' is restricted.
`,
		},
		{
			code: `
import foo from "internal/secret";
`,
			options: {
				patterns: ["internal/*"],
			},
			snapshot: `
import foo from "internal/secret";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'internal/secret' import is restricted from being used by a pattern.
`,
		},
		{
			code: `
import foo from "internal/secret";
`,
			options: {
				patterns: [
					{
						group: ["internal/*"],
						message: "Do not import from internal modules.",
					},
				],
			},
			snapshot: `
import foo from "internal/secret";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'internal/secret' import is restricted from being used by a pattern. Do not import from internal modules.
`,
		},
		{
			code: `
import { badName } from "utils/helpers";
`,
			options: {
				patterns: [
					{
						group: ["utils/*"],
						importNames: ["badName"],
					},
				],
			},
			snapshot: `
import { badName } from "utils/helpers";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'badName' import from 'utils/helpers' is restricted.
`,
		},
		{
			code: `
export { foo } from "forbidden";
`,
			options: {
				paths: ["forbidden"],
			},
			snapshot: `
export { foo } from "forbidden";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'forbidden' import is restricted from being used.
`,
		},
		{
			code: `
export * from "forbidden";
`,
			options: {
				paths: ["forbidden"],
			},
			snapshot: `
export * from "forbidden";
~~~~~~~~~~~~~~~~~~~~~~~~~~
'forbidden' import is restricted from being used.
`,
		},
		{
			code: `
import { foo } from "mod";
`,
			options: {
				paths: [
					{
						allowTypeImports: true,
						name: "mod",
					},
				],
			},
			snapshot: `
import { foo } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~
'mod' import is restricted from being used.
`,
		},
		{
			code: `
import { type A, b } from "mod";
`,
			options: {
				paths: [
					{
						allowTypeImports: true,
						importNames: ["A", "b"],
						name: "mod",
					},
				],
			},
			snapshot: `
import { type A, b } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'b' import from 'mod' is restricted.
`,
		},
		{
			code: `
import { badExport } from "mod";
`,
			options: {
				paths: [
					{
						importNames: ["badExport"],
						message: "Use goodExport instead.",
						name: "mod",
					},
				],
			},
			snapshot: `
import { badExport } from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'badExport' import from 'mod' is restricted. Use goodExport instead.
`,
		},
		{
			code: `
import * as ns from "mod";
`,
			options: {
				paths: [
					{
						importNames: ["a", "b"],
						message: "Import specific allowed names.",
						name: "mod",
					},
				],
			},
			snapshot: `
import * as ns from "mod";
~~~~~~~~~~~~~~~~~~~~~~~~~~
* import is invalid because 'a', 'b' from 'mod' is restricted. Import specific allowed names.
`,
		},
		{
			code: `
export * from "mod";
`,
			options: {
				paths: [
					{
						importNames: ["secret"],
						name: "mod",
					},
				],
			},
			snapshot: `
export * from "mod";
~~~~~~~~~~~~~~~~~~~~
* import is invalid because 'secret' from 'mod' is restricted.
`,
		},
	],
	valid: [
		{
			code: `import foo from "allowed";`,
			options: {
				paths: ["forbidden"],
			},
		},
		{
			code: `import type { Foo } from "mod";`,
			options: {
				paths: [
					{
						allowTypeImports: true,
						name: "mod",
					},
				],
			},
		},
		{
			code: `import { allowed } from "mod";`,
			options: {
				paths: [
					{
						allowImportNames: ["allowed"],
						name: "mod",
					},
				],
			},
		},
		{
			code: `import { goodExport } from "mod";`,
			options: {
				paths: [
					{
						importNames: ["badExport"],
						name: "mod",
					},
				],
			},
		},
		{
			code: `import foo from "external/lib";`,
			options: {
				patterns: ["internal/*"],
			},
		},
		`import foo from "anything";`,
		{
			code: `import "mod";`,
			options: {
				paths: [
					{
						importNames: ["badExport"],
						name: "mod",
					},
				],
			},
		},
		{
			code: `import { type A } from "mod";`,
			options: {
				paths: [
					{
						allowTypeImports: true,
						importNames: ["A"],
						name: "mod",
					},
				],
			},
		},
		{
			code: `const foo = 1; export { foo };`,
			options: {
				paths: ["forbidden"],
			},
		},
		{
			code: `import { allowed } from "utils/helpers";`,
			options: {
				patterns: [
					{
						allowImportNames: ["allowed"],
						group: ["utils/*"],
					},
				],
			},
		},
		{
			code: `export type { Foo } from "mod";`,
			options: {
				paths: [
					{
						allowTypeImports: true,
						name: "mod",
					},
				],
			},
		},
	],
});
