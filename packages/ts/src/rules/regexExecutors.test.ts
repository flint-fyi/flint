import rule from "./regexExecutors.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"something".match(/thing/);
`,
			output: `
/thing/.exec("something");
`,
			snapshot: `
"something".match(/thing/);
~~~~~~~~~~~~~~~~~~~~~~~~~~
For consistency, prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
"something".match(new RegExp("thing"));
`,
			output: `
new RegExp("thing").exec("something");
`,
			snapshot: `
"something".match(new RegExp("thing"));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
For consistency, prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
"something".match(RegExp("thing"));
`,
			output: `
RegExp("thing").exec("something");
`,
			snapshot: `
"something".match(RegExp("thing"));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
For consistency, prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
"something".match(/thin[[g]]/v);
`,
			output: `
/thin[[g]]/v.exec("something");
`,
			snapshot: `
"something".match(/thin[[g]]/v);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
For consistency, prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
const getValue = (input: string) => input + "";
getValue("test").match(/pattern/);
`,
			output: `
const getValue = (input: string) => input + "";
/pattern/.exec(getValue("test"));
`,
			snapshot: `
const getValue = (input: string) => input + "";
getValue("test").match(/pattern/);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
For consistency, prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
	],
	valid: [
		`/thing/.exec("something");`,
		`"example".match(/thing/g);`,
		`
const text = "something";
const search = /thing/;
search.exec(text);
`,
		`/thin[[g]]/v.exec("something");`,
		`"something".match(/thing/gi);`,
		`"something".match(new RegExp("thing", "g"));`,
		`(123).toString().match(variable);`,
		`someArray.match(/pattern/);`,
		`
const text = "something";
const search = /thing/;
text.match(search);
`,
		`
declare const hasExec: { exec(...args: unknown[]): unknown };
hasExec.exec("test");
`,
		`
declare const hasMatch: { match(...args: unknown[]): unknown };
hasExec.match(/test/
`,
	],
});
