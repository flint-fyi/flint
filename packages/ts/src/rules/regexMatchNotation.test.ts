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
 Prefer '[\s\S]' over '[\S\s]' to match any character.
`,
		},
		{
			code: `
/[^]/;
`,
			snapshot: String.raw`
/[^]/;
 ~~~
 Prefer '[\s\S]' over '[^]' to match any character.
`,
		},
		{
			code: String.raw`
/[\d\D]/;
`,
			snapshot: String.raw`
/[\d\D]/;
 ~~~~~~
 Prefer '[\s\S]' over '[\d\D]' to match any character.
`,
		},
		{
			code: String.raw`
/[\D\d]/;
`,
			snapshot: String.raw`
/[\D\d]/;
 ~~~~~~
 Prefer '[\s\S]' over '[\D\d]' to match any character.
`,
		},
		{
			code: String.raw`
/[\w\W]/;
`,
			snapshot: String.raw`
/[\w\W]/;
 ~~~~~~
 Prefer '[\s\S]' over '[\w\W]' to match any character.
`,
		},
		{
			code: String.raw`
/[\W\w]/;
`,
			snapshot: String.raw`
/[\W\w]/;
 ~~~~~~
 Prefer '[\s\S]' over '[\W\w]' to match any character.
`,
		},
		{
			code: String.raw`
/[\0-\uFFFF]/;
`,
			snapshot: String.raw`
/[\0-\uFFFF]/;
 ~~~~~~~~~~~
 Prefer '[\s\S]' over '[\0-\uFFFF]' to match any character.
`,
		},
		{
			code: String.raw`
/[\p{ASCII}\P{ASCII}]/u;
`,
			snapshot: String.raw`
/[\p{ASCII}\P{ASCII}]/u;
 ~~~~~~~~~~~~~~~~~~~~
 Prefer '[\s\S]' over '[\p{ASCII}\P{ASCII}]' to match any character.
`,
		},
		{
			code: String.raw`
new RegExp("[\\S\\s]");
`,
			snapshot: String.raw`
new RegExp("[\\S\\s]");
            ~~~~~~
            Prefer '[\s\S]' over '[\S\s]' to match any character.
`,
		},
		{
			code: `
RegExp("[^]");
`,
			snapshot: String.raw`
RegExp("[^]");
        ~~~
        Prefer '[\s\S]' over '[^]' to match any character.
`,
		},
		{
			code: String.raw`
/[\S\s]/v;
`,
			snapshot: String.raw`
/[\S\s]/v;
 ~~~~~~
 Prefer '[\s\S]' over '[\S\s]' to match any character.
`,
		},
		{
			code: `
/[^]/s;
`,
			snapshot: String.raw`
/[^]/s;
 ~~~
 Prefer '.' over '[^]' to match any character.
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
