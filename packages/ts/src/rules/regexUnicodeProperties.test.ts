/* spellchecker:disable */
import rule from "./regexUnicodeProperties.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/\\p{gc=L}/u;
`,
			output: `
/\\p{L}/u;
`,
			snapshot: `
/\\p{gc=L}/u;
 ~~~~~~~~
 The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: `
/\\p{gc=Letter}/u;
`,
			output: `
/\\p{Letter}/u;
`,
			snapshot: `
/\\p{gc=Letter}/u;
 ~~~~~~~~~~~~~
 The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: `
/\\p{General_Category=L}/u;
`,
			output: `
/\\p{L}/u;
`,
			snapshot: `
/\\p{General_Category=L}/u;
 ~~~~~~~~~~~~~~~~~~~~~~
 The 'General_Category=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: `
/\\P{gc=L}/u;
`,
			output: `
/\\P{L}/u;
`,
			snapshot: `
/\\P{gc=L}/u;
 ~~~~~~~~
 The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: `
new RegExp("\\\\p{gc=L}", "u");
`,
			output: `
new RegExp("\\\\p{L}", "u");
`,
			snapshot: `
new RegExp("\\\\p{gc=L}", "u");
            ~~~~~~~~
            The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: `
/\\p{sc=Grek}/u;
`,
			output: `
/\\p{sc=Greek}/u;
`,
			snapshot: `
/\\p{sc=Grek}/u;
 ~~~~~~~~~~~
 Use long Script property name 'Greek' instead of 'Grek'.
`,
		},
		{
			code: `
/\\p{scx=Latn}/u;
`,
			output: `
/\\p{scx=Latin}/u;
`,
			snapshot: `
/\\p{scx=Latn}/u;
 ~~~~~~~~~~~~
 Use long Script property name 'Latin' instead of 'Latn'.
`,
		},
		{
			code: `
/\\p{Script=Cyrl}/u;
`,
			output: `
/\\p{Script=Cyrillic}/u;
`,
			snapshot: `
/\\p{Script=Cyrl}/u;
 ~~~~~~~~~~~~~~~
 Use long Script property name 'Cyrillic' instead of 'Cyrl'.
`,
		},
		{
			code: `
new RegExp("\\\\p{sc=Grek}", "u");
`,
			output: `
new RegExp("\\\\p{sc=Greek}", "u");
`,
			snapshot: `
new RegExp("\\\\p{sc=Grek}", "u");
            ~~~~~~~~~~~
            Use long Script property name 'Greek' instead of 'Grek'.
`,
		},
		{
			code: `
/\\p{Script_Extensions=Arab}/u;
`,
			output: `
/\\p{Script_Extensions=Arabic}/u;
`,
			snapshot: `
/\\p{Script_Extensions=Arab}/u;
 ~~~~~~~~~~~~~~~~~~~~~~~~~~
 Use long Script property name 'Arabic' instead of 'Arab'.
`,
		},
		{
			code: `
/\\P{sc=Hebr}/u;
`,
			output: `
/\\P{sc=Hebrew}/u;
`,
			snapshot: `
/\\P{sc=Hebr}/u;
 ~~~~~~~~~~~
 Use long Script property name 'Hebrew' instead of 'Hebr'.
`,
		},
	],
	valid: [
		`/\\p{L}/u;`,
		`/\\p{Letter}/u;`,
		`/\\p{sc=Greek}/u;`,
		`/\\p{Script=Latin}/u;`,
		`/\\p{ASCII}/u;`,
		`/\\p{L}/;`,
		`/abc/u;`,
		`new RegExp(variable, "u");`,
		`new RegExp("\\\\p{L}", "u");`,
		`new RegExp("\\\\p{sc=Greek}", "u");`,
	],
});
