import rule from "./regexLegacyFeatures.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
RegExp.input;
`,
			snapshot: `
RegExp.input;
~~~~~~~~~~~~
The 'RegExp.input' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$_;
`,
			snapshot: `
RegExp.$_;
~~~~~~~~~
The 'RegExp.$_' static property is deprecated.
`,
		},
		{
			code: `
RegExp.lastMatch;
`,
			snapshot: `
RegExp.lastMatch;
~~~~~~~~~~~~~~~~
The 'RegExp.lastMatch' static property is deprecated.
`,
		},
		{
			code: `
RegExp["$&"];
`,
			snapshot: `
RegExp["$&"];
~~~~~~~~~~~~
The 'RegExp.$&' static property is deprecated.
`,
		},
		{
			code: `
RegExp.lastParen;
`,
			snapshot: `
RegExp.lastParen;
~~~~~~~~~~~~~~~~
The 'RegExp.lastParen' static property is deprecated.
`,
		},
		{
			code: `
RegExp["$+"];
`,
			snapshot: `
RegExp["$+"];
~~~~~~~~~~~~
The 'RegExp.$+' static property is deprecated.
`,
		},
		{
			code: `
RegExp.leftContext;
`,
			snapshot: `
RegExp.leftContext;
~~~~~~~~~~~~~~~~~~
The 'RegExp.leftContext' static property is deprecated.
`,
		},
		{
			code: `
RegExp["$\`"];
`,
			snapshot: `
RegExp["$\`"];
~~~~~~~~~~~~
The 'RegExp.$\`' static property is deprecated.
`,
		},
		{
			code: `
RegExp.rightContext;
`,
			snapshot: `
RegExp.rightContext;
~~~~~~~~~~~~~~~~~~~
The 'RegExp.rightContext' static property is deprecated.
`,
		},
		{
			code: `
RegExp["$'"];
`,
			snapshot: `
RegExp["$'"];
~~~~~~~~~~~~
The 'RegExp.$'' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$1;
`,
			snapshot: `
RegExp.$1;
~~~~~~~~~
The 'RegExp.$1' static property is deprecated.
`,
		},
		{
			code: `
RegExp["$2"];
`,
			snapshot: `
RegExp["$2"];
~~~~~~~~~~~~
The 'RegExp.$2' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$3;
`,
			snapshot: `
RegExp.$3;
~~~~~~~~~
The 'RegExp.$3' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$4;
`,
			snapshot: `
RegExp.$4;
~~~~~~~~~
The 'RegExp.$4' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$5;
`,
			snapshot: `
RegExp.$5;
~~~~~~~~~
The 'RegExp.$5' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$6;
`,
			snapshot: `
RegExp.$6;
~~~~~~~~~
The 'RegExp.$6' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$7;
`,
			snapshot: `
RegExp.$7;
~~~~~~~~~
The 'RegExp.$7' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$8;
`,
			snapshot: `
RegExp.$8;
~~~~~~~~~
The 'RegExp.$8' static property is deprecated.
`,
		},
		{
			code: `
RegExp.$9;
`,
			snapshot: `
RegExp.$9;
~~~~~~~~~
The 'RegExp.$9' static property is deprecated.
`,
		},
		{
			code: `
const regex = new RegExp('pattern', 'gi');
regex.compile;
`,
			snapshot: `
const regex = new RegExp('pattern', 'gi');
regex.compile;
~~~~~~~~~~~~~
The 'RegExp.prototype.compile' method is deprecated.
`,
		},
		{
			code: `
const regex = /pattern/;
regex.compile('new pattern', 'g');
`,
			snapshot: `
const regex = /pattern/;
regex.compile('new pattern', 'g');
~~~~~~~~~~~~~
The 'RegExp.prototype.compile' method is deprecated.
`,
		},
	],
	valid: [
		`RegExp;`,
		`new RegExp();`,
		`RegExp.unknown;`,
		`RegExp.test;`,
		`RegExp.exec;`,
		`RegExp.prototype;`,
		`/pattern/.test('value');`,
		`/pattern/.exec('value');`,
		`const regex = /pattern/; regex.test('value');`,
		`const regex = new RegExp('pattern'); regex.exec('value');`,
		`const Custom = { $1: 1 }; Custom.$1;`,
		`const obj = { compile: () => {} }; obj.compile();`,
	],
});
