import rule from "./regexMatchNotation.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\S\s]/;
`,
			snapshot: String.raw`
/[\S\s]/;
 ~~~~~~
 For consistency, prefer '[\s\S]' over '[\S\s]' to match any character.
`,
		},
		{
			code: `
/[^]/;
`,
			snapshot: String.raw`
/[^]/;
 ~~~
 For consistency, prefer '[\s\S]' over '[^]' to match any character.
`,
		},
		{
			code: String.raw`
/[\d\D]/;
`,
			snapshot: String.raw`
/[\d\D]/;
 ~~~~~~
 For consistency, prefer '[\s\S]' over '[\d\D]' to match any character.
`,
		},
		{
			code: String.raw`
/[\D\d]/;
`,
			snapshot: String.raw`
/[\D\d]/;
 ~~~~~~
 For consistency, prefer '[\s\S]' over '[\D\d]' to match any character.
`,
		},
		{
			code: String.raw`
/[\w\W]/;
`,
			snapshot: String.raw`
/[\w\W]/;
 ~~~~~~
 For consistency, prefer '[\s\S]' over '[\w\W]' to match any character.
`,
		},
		{
			code: String.raw`
/[\W\w]/;
`,
			snapshot: String.raw`
/[\W\w]/;
 ~~~~~~
 For consistency, prefer '[\s\S]' over '[\W\w]' to match any character.
`,
		},
		{
			code: String.raw`
/[\0-\uFFFF]/;
`,
			snapshot: String.raw`
/[\0-\uFFFF]/;
 ~~~~~~~~~~~
 For consistency, prefer '[\s\S]' over '[\0-\uFFFF]' to match any character.
`,
		},
		{
			code: String.raw`
/[\p{ASCII}\P{ASCII}]/u;
`,
			snapshot: String.raw`
/[\p{ASCII}\P{ASCII}]/u;
 ~~~~~~~~~~~~~~~~~~~~
 For consistency, prefer '[\s\S]' over '[\p{ASCII}\P{ASCII}]' to match any character.
`,
		},
		{
			code: String.raw`
new RegExp("[\\S\\s]");
`,
			snapshot: String.raw`
new RegExp("[\\S\\s]");
            ~~~~~~
            For consistency, prefer '[\s\S]' over '[\S\s]' to match any character.
`,
		},
		{
			code: `
RegExp("[^]");
`,
			snapshot: String.raw`
RegExp("[^]");
        ~~~
        For consistency, prefer '[\s\S]' over '[^]' to match any character.
`,
		},
		{
			code: String.raw`
/[\S\s]/v;
`,
			snapshot: String.raw`
/[\S\s]/v;
 ~~~~~~
 For consistency, prefer '[\s\S]' over '[\S\s]' to match any character.
`,
		},
		{
			code: `
/[^]/s;
`,
			snapshot: String.raw`
/[^]/s;
 ~~~
 For consistency, prefer '.' over '[^]' to match any character.
`,
		},
	],
	valid: [
		String.raw`/[\s\S]/;`,
		`/./s;`,
		`/./;`,
		String.raw`/[\s\d]/;`,
		String.raw`/\S\s/;`,
		String.raw`/[^\S\s]/;`,
		String.raw`/[^\s\S]/;`,
		String.raw`/[^\d\D]/;`,
		String.raw`/[^\D\d]/;`,
		String.raw`/[^\w\W]/;`,
		String.raw`/[^\W\w]/;`,
		String.raw`new RegExp("[\\s\\S]");`,
		`RegExp(variable);`,
	],
});
