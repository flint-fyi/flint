import rule from "./moduleSpecifierLists.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import {} from 'module';
`,
			snapshot: `
import {} from 'module';
       ~~
       Import statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
				{
					id: "convertToSideEffectImport",
					updated: `
import 'module';
`,
				},
			],
		},
		{
			code: `
import defaultExport, {} from 'module';
`,
			snapshot: `
import defaultExport, {} from 'module';
                      ~~
                      Import statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeEmptyBraces",
					updated: `
import defaultExport from 'module';
`,
				},
			],
		},
		{
			code: `
import type {} from 'module';
`,
			snapshot: `
import type {} from 'module';
            ~~
            Import statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
			],
		},
		{
			code: `
export {} from 'module';
`,
			snapshot: `
export {} from 'module';
~~~~~~~~~~~~~~~~~~~~~~~~
Export statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
				{
					id: "convertToSideEffectImport",
					updated: `
import 'module';
`,
				},
			],
		},
		{
			code: `
export type {} from 'module';
`,
			snapshot: `
export type {} from 'module';
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Export statement with empty specifier list is unnecessary.
`,
			suggestions: [
				{
					id: "removeStatement",
					updated: `

`,
				},
				{
					id: "convertToSideEffectImport",
					updated: `
import 'module';
`,
				},
			],
		},
	],
	valid: [
		`import { something } from 'module';`,
		`import defaultExport from 'module';`,
		`import * as namespace from 'module';`,
		`import 'module';`,
		`import defaultExport, { named } from 'module';`,
		`import defaultExport, * as namespace from 'module';`,
		`export { something } from 'module';`,
		`export * from 'module';`,
		`export { local };`,
		`export default value;`,
		`import type { Type } from 'module';`,
		`export type { Type } from 'module';`,
	],
});
