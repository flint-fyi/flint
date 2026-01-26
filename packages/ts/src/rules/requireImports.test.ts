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
          Use ES module imports instead of CommonJS require().
`,
		},
		{
			code: `
var x = require('lib');
`,
			snapshot: `
var x = require('lib');
        ~~~~~~~
        Use ES module imports instead of CommonJS require().
`,
		},
		{
			code: `
let x = require('lib');
`,
			snapshot: `
let x = require('lib');
        ~~~~~~~
        Use ES module imports instead of CommonJS require().
`,
		},
		{
			code: `
require('lib');
`,
			snapshot: `
require('lib');
~~~~~~~
Use ES module imports instead of CommonJS require().
`,
		},
		{
			code: `
import x = require('lib');
`,
			snapshot: `
import x = require('lib');
           ~~~~~~~~~~~~~~
           Use ES module imports instead of CommonJS require().
`,
		},
		{
			code: `
const { x, y } = require('lib');
`,
			snapshot: `
const { x, y } = require('lib');
                 ~~~~~~~
                 Use ES module imports instead of CommonJS require().
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
