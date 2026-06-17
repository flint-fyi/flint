import rule from "./exportFromImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import defaultExport from './foo.js';
export default defaultExport;
`,
			files: {
				"foo.ts": `
declare const defaultExport: unknown;

export default defaultExport;
`,
			},
			snapshot: `
import defaultExport from './foo.js';
export default defaultExport;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`export { default } from './foo.js'\` instead of separate import and export default.
`,
		},
		{
			code: `
import { named } from './foo.js';
export { named };
`,
			files: {
				"foo.ts": `
export declare const named: unknown;
`,
			},
			snapshot: `
import { named } from './foo.js';
export { named };
         ~~~~~
         Prefer \`export { named } from './foo.js'\` instead of separate import and export.
`,
		},
		{
			code: `
import * as namespace from './foo.js';
export { namespace };
`,
			files: {
				"foo.ts": `
export declare const named: unknown;
`,
			},
			snapshot: `
import * as namespace from './foo.js';
export { namespace };
         ~~~~~~~~~
         Prefer \`export * as namespace from './foo.js'\` instead of separate import and export.
`,
		},
		{
			code: `
import { foo, bar } from './module.js';
export { foo, bar };
`,
			files: {
				"module.ts": `
export declare const bar: unknown;
export declare const foo: unknown;
`,
			},
			snapshot: `
import { foo, bar } from './module.js';
export { foo, bar };
         ~~~
         Prefer \`export { foo } from './module.js'\` instead of separate import and export.
              ~~~
              Prefer \`export { bar } from './module.js'\` instead of separate import and export.
`,
		},
		{
			code: `
import { original as renamed } from './module.js';
export { renamed };
`,
			files: {
				"module.ts": `
export declare const original: unknown;
`,
			},
			snapshot: `
import { original as renamed } from './module.js';
export { renamed };
         ~~~~~~~
         Prefer \`export { renamed } from './module.js'\` instead of separate import and export.
`,
		},
	],
	valid: [
		{
			code: `export { named } from './foo.js';`,
			files: {
				"foo.ts": `
export declare const named: unknown;
`,
			},
		},
		{
			code: `export { default } from './foo.js';`,
			files: {
				"foo.ts": `
declare const defaultExport: unknown;

export default defaultExport;
`,
			},
		},
		{
			code: `export * as namespace from './foo.js';`,
			files: {
				"foo.ts": `
export declare const named: unknown;
`,
			},
		},
		{
			code: `
import { named } from './foo.js';

const x = named();
`,
			files: {
				"foo.ts": `
export declare function named(): unknown;
`,
			},
		},
		{
			code: `
import { named } from './foo.js';

void named;
`,
			files: {
				"foo.ts": `
export declare const named: unknown;
`,
			},
		},
		`const foo = 1;
export { foo };`,
	],
});
