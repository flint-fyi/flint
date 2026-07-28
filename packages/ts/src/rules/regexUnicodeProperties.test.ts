/* spellchecker:disable */
import rule from "./regexUnicodeProperties.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\p{gc=L}/u;
`,
			output: String.raw`
/\p{L}/u;
`,
			snapshot: String.raw`
/\p{gc=L}/u;
 ~~~~~~~~
 The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: String.raw`
/\p{gc=Letter}/u;
`,
			output: String.raw`
/\p{Letter}/u;
`,
			snapshot: String.raw`
/\p{gc=Letter}/u;
 ~~~~~~~~~~~~~
 The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: String.raw`
/\p{General_Category=L}/u;
`,
			output: String.raw`
/\p{L}/u;
`,
			snapshot: String.raw`
/\p{General_Category=L}/u;
 ~~~~~~~~~~~~~~~~~~~~~~
 The 'General_Category=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: String.raw`
/\P{gc=L}/u;
`,
			output: String.raw`
/\P{L}/u;
`,
			snapshot: String.raw`
/\P{gc=L}/u;
 ~~~~~~~~
 The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: String.raw`
new RegExp("\\p{gc=L}", "u");
`,
			output: String.raw`
new RegExp("\\p{L}", "u");
`,
			snapshot: String.raw`
new RegExp("\\p{gc=L}", "u");
            ~~~~~~~~
            The 'gc=' prefix is unnecessary for this Unicode property.
`,
		},
		{
			code: String.raw`
/\p{sc=Grek}/u;
`,
			output: String.raw`
/\p{sc=Greek}/u;
`,
			snapshot: String.raw`
/\p{sc=Grek}/u;
 ~~~~~~~~~~~
 Use long Script property name 'Greek' instead of 'Grek'.
`,
		},
		{
			code: String.raw`
/\p{scx=Latn}/u;
`,
			output: String.raw`
/\p{scx=Latin}/u;
`,
			snapshot: String.raw`
/\p{scx=Latn}/u;
 ~~~~~~~~~~~~
 Use long Script property name 'Latin' instead of 'Latn'.
`,
		},
		{
			code: String.raw`
/\p{Script=Cyrl}/u;
`,
			output: String.raw`
/\p{Script=Cyrillic}/u;
`,
			snapshot: String.raw`
/\p{Script=Cyrl}/u;
 ~~~~~~~~~~~~~~~
 Use long Script property name 'Cyrillic' instead of 'Cyrl'.
`,
		},
		{
			code: String.raw`
new RegExp("\\p{sc=Grek}", "u");
`,
			output: String.raw`
new RegExp("\\p{sc=Greek}", "u");
`,
			snapshot: String.raw`
new RegExp("\\p{sc=Grek}", "u");
            ~~~~~~~~~~~
            Use long Script property name 'Greek' instead of 'Grek'.
`,
		},
		{
			code: String.raw`
/\p{Script_Extensions=Arab}/u;
`,
			output: String.raw`
/\p{Script_Extensions=Arabic}/u;
`,
			snapshot: String.raw`
/\p{Script_Extensions=Arab}/u;
 ~~~~~~~~~~~~~~~~~~~~~~~~~~
 Use long Script property name 'Arabic' instead of 'Arab'.
`,
		},
		{
			code: String.raw`
/\P{sc=Hebr}/u;
`,
			output: String.raw`
/\P{sc=Hebrew}/u;
`,
			snapshot: String.raw`
/\P{sc=Hebr}/u;
 ~~~~~~~~~~~
 Use long Script property name 'Hebrew' instead of 'Hebr'.
`,
		},
	],
	valid: [
		String.raw`/\p{L}/u;`,
		String.raw`/\p{Letter}/u;`,
		String.raw`/\p{sc=Greek}/u;`,
		String.raw`/\p{Script=Latin}/u;`,
		String.raw`/\p{ASCII}/u;`,
		String.raw`/\p{L}/;`,
		`/abc/u;`,
		`new RegExp(variable, "u");`,
		String.raw`new RegExp("\\p{L}", "u");`,
		String.raw`new RegExp("\\p{sc=Greek}", "u");`,
	],
});
