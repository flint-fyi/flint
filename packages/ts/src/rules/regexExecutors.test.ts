import rule from "./regexExecutors.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"something".match(/thing/);
`,
			snapshot: `
"something".match(/thing/);
~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
"some things are just things".match(/thing/);
`,
			snapshot: `
"some things are just things".match(/thing/);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
"something".match(new RegExp("thing"));
`,
			snapshot: `
"something".match(new RegExp("thing"));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
"something".match(RegExp("thing"));
`,
			snapshot: `
"something".match(RegExp("thing"));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
"something".match(/thin[[g]]/v);
`,
			snapshot: `
"something".match(/thin[[g]]/v);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
		{
			code: `
const getValue = (input: string) => input + "";
getValue("test").match(/pattern/);
`,
			snapshot: `
const getValue = (input: string) => input + "";
getValue("test").match(/pattern/);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`RegExp.prototype.exec()\` over \`String.prototype.match()\` when not using the global flag.
`,
		},
	],
	valid: [
		`/thing/.exec("something");`,
		`"some things are just things".match(/thing/g);`,
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
	],
});
