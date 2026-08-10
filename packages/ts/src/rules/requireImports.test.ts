import rule from "./requireImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const x = require('lib');
`,
			files: {
				"require.d.ts": `
declare function require(specifier: "lib"): {
    x: unknown;
    y: unknown;
};
`,
			},
			snapshot: `
const x = require('lib');
          ~~~~~~~
          Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
		{
			code: `
var x = require('lib');
`,
			files: {
				"require.d.ts": `
declare function require(specifier: "lib"): {
    x: unknown;
    y: unknown;
};
`,
			},
			snapshot: `
var x = require('lib');
        ~~~~~~~
        Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
		{
			code: `
let x = require('lib');
`,
			files: {
				"require.d.ts": `
declare function require(specifier: "lib"): {
    x: unknown;
    y: unknown;
};
`,
			},
			snapshot: `
let x = require('lib');
        ~~~~~~~
        Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
		{
			code: `
require('lib');
`,
			files: {
				"require.d.ts": `
declare function require(specifier: "lib"): {
    x: unknown;
    y: unknown;
};
`,
			},
			snapshot: `
require('lib');
~~~~~~~
Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
		{
			code: `
const { x, y } = require('lib');
`,
			files: {
				"require.d.ts": `
declare function require(specifier: "lib"): {
    x: unknown;
    y: unknown;
};
`,
			},
			snapshot: `
const { x, y } = require('lib');
                 ~~~~~~~
                 Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
	],
	valid: [
		{
			code: `import x from 'lib';`,
			files: {
				"node_modules/lib/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const x: unknown;
export type X = unknown;
`,
			},
		},
		{
			code: `import { x } from 'lib';`,
			files: {
				"node_modules/lib/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const x: unknown;
export type X = unknown;
`,
			},
		},
		{
			code: `import * as x from 'lib';`,
			files: {
				"node_modules/lib/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const x: unknown;
export type X = unknown;
`,
			},
		},
		{
			code: `import type { X } from 'lib';`,
			files: {
				"node_modules/lib/index.d.ts": `
declare const defaultExport: unknown;

export default defaultExport;
export const x: unknown;
export type X = unknown;
`,
			},
		},
		`function requireSomething(specifier: string) { return specifier; }
requireSomething('lib');`,
		`const obj = {
    require(specifier: string) {
        return specifier;
    },
};
obj.require('lib');`,
		`const require = (specifier: string) => specifier; require('lib'); export {};`,
	],
});
