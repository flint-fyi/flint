// flint-disable-file escapeSequenceCasing
import rule from "./regexDuplicateCharacterClassCharacters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[aaa]/;
`,
			snapshot: `
/[aaa]/;
   ~
   Duplicate character 'a' in character class.
    ~
    Duplicate character 'a' in character class.
`,
		},
		{
			code: `
/[aba]/;
`,
			snapshot: `
/[aba]/;
    ~
    Duplicate character 'a' in character class.
`,
		},
		{
			code: `
/[a-za]/;
`,
			snapshot: `
/[a-za]/;
     ~
     Character 'a' is already included in range 'a-z'.
`,
		},
		{
			code: `
/[0-9 5]/;
`,
			snapshot: `
/[0-9 5]/;
      ~
      Character '5' is already included in range '0-9'.
`,
		},
		{
			code: `
/[a-z a-z]/;
`,
			snapshot: `
/[a-z a-z]/;
      ~~~
      Duplicate character 'a-z' in character class.
`,
		},
		{
			code: `
new RegExp("[aa]");
`,
			snapshot: `
new RegExp("[aa]");
              ~
              Duplicate character 'a' in character class.
`,
		},
		{
			code: `
RegExp("[0-9 9]");
`,
			snapshot: `
RegExp("[0-9 9]");
             ~
             Character '9' is already included in range '0-9'.
`,
		},
		{
			code: `
/[A-Za-zA-Z]/;
`,
			snapshot: `
/[A-Za-zA-Z]/;
        ~~~
        Duplicate character 'A-Z' in character class.
`,
		},
	],
	valid: [
		"/[a][a][a]/",
		"/[abc]/",
		`/[0-9a-z]/;`,
		`/[a-z]/;`,
		`/[a-zA-Z]/;`,
		`/[a-zA-Z0-9]/;`,
		`/[a][a][a]/;`,
		`/[abc]/;`,
		`new RegExp("");`,
		`new RegExp("[a][a]");`,
		`new RegExp("[abc]");`,
		`new RegExp(value);`,
		String.raw`/[\q{a}\q{ab}\q{abc}[\w--[ab]][\w&&b]]/v`,
		String.raw`/[\S \f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/`,
		String.raw`/[\u1fff-\u2020\s]/`,
		String.raw`/[\w \/-:]/`,
		String.raw`/[\w\p{L}]/u`,
		String.raw`/[\WA-Za-z0-9_]/`,
		String.raw`/[0-9\D]/`,
		String.raw`/\p{ASCII}abc/u`,
		String.raw`/\s \f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff/`,
		String.raw`const regexp = new RegExp('[\\wA-Za-z0-9_][invalid');`,
		String.raw`const regexp = /[a-zA-Z0-9\s]/`,
	],
});
