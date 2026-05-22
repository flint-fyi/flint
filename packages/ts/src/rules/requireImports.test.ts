import rule from "./requireImports.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const x = require('lib');
`,
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
			snapshot: `
require('lib');
~~~~~~~
Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
		{
			code: `
import x = require('lib');
`,
			snapshot: `
import x = require('lib');
           ~~~~~~~~~~~~~~
           Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
		{
			code: `
const { x, y } = require('lib');
`,
			snapshot: `
const { x, y } = require('lib');
                 ~~~~~~~
                 Prefer ESM \`import\` statements over legacy CommonJS \`require()\` calls.
`,
		},
	],
	valid: [
		`import x from 'lib';`,
		`import { x } from 'lib';`,
		`import * as x from 'lib';`,
		`import type { X } from 'lib';`,
		`requireSomething('lib');`,
		`obj.require('lib');`,
		`const require = () => {}; require('lib'); export {};`,
	],
});
