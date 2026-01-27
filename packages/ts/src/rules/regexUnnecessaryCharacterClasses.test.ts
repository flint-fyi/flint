// flint-disable-file octalEscapes
import rule from "./regexUnnecessaryCharacterClasses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[a]/;
`,
			snapshot: `
/[a]/;
 ~~~
 This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: String.raw`
/[\d]/;
`,
			snapshot: String.raw`
/[\d]/;
 ~~~~
 This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: String.raw`
/[\w]/;
`,
			snapshot: String.raw`
/[\w]/;
 ~~~~
 This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: String.raw`
/[\s]/;
`,
			snapshot: String.raw`
/[\s]/;
 ~~~~
 This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: `
/[.]/;
`,
			snapshot: `
/[.]/;
 ~~~
 This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: String.raw`
/[+]/;
`,
			snapshot: String.raw`
/[+]/;
 ~~~
 This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: String.raw`
/[\n]/;
`,
			snapshot: String.raw`
/[\n]/;
 ~~~~
 This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: `
new RegExp("[a]");
`,
			snapshot: `
new RegExp("[a]");
            ~~~
            This character class wraps a single element that does not require brackets.
`,
		},
		{
			code: String.raw`
RegExp("[\\d]");
`,
			snapshot: String.raw`
RegExp("[\\d]");
        ~~~~
        This character class wraps a single element that does not require brackets.
`,
		},
	],
	valid: [
		`/[^a]/;`,
		String.raw`/[\b]/;`,
		String.raw`/[\1]/;`,
		`/[=]/;`,
		`/[ab]/;`,
		`/[a-z]/;`,
		`/[a-a]/;`,
		String.raw`/[\d\s]/;`,
		`new RegExp(variable);`,
		`/[^]/;`,
		`/abc/;`,
	],
});
