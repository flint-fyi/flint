import rule from "./bufferAllocators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const buffer = new Buffer('7468697320697320612074c3a97374', 'hex');
`,
			snapshot: `
const buffer = new Buffer('7468697320697320612074c3a97374', 'hex');
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`Buffer.from()\` or \`Buffer.alloc()\` over the deprecated \`new Buffer()\` constructor.
`,
		},
		{
			code: `
const buffer = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
`,
			snapshot: `
const buffer = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`Buffer.from()\` or \`Buffer.alloc()\` over the deprecated \`new Buffer()\` constructor.
`,
		},
		{
			code: `
const buffer = new Buffer(10);
`,
			snapshot: `
const buffer = new Buffer(10);
               ~~~~~~~~~~~~~~
               Prefer \`Buffer.from()\` or \`Buffer.alloc()\` over the deprecated \`new Buffer()\` constructor.
`,
		},
		{
			code: `
const buffer = new Buffer('test');
`,
			snapshot: `
const buffer = new Buffer('test');
               ~~~~~~~~~~~~~~~~~~
               Prefer \`Buffer.from()\` or \`Buffer.alloc()\` over the deprecated \`new Buffer()\` constructor.
`,
		},
	],
	valid: [
		`const buffer = Buffer.from('7468697320697320612074c3a97374', 'hex');`,
		`const buffer = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);`,
		`const buffer = Buffer.alloc(10);`,
		`const buffer = Buffer.from('test');`,
		`const value = new CustomBuffer(10);`,
	],
});
