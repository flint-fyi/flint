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
		`/[abc]/;`,
		`/[a-zA-Z0-9]/;`,
		`/[a][a][a]/;`,
		`/[a-z]/;`,
		`/[0-9a-z]/;`,
		`new RegExp("[abc]");`,
		`new RegExp(variable);`,
		`/[a-zA-Z]/;`,
	],
});
