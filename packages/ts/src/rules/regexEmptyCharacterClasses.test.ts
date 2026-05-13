import rule from "./regexEmptyCharacterClasses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[]/;
`,
			snapshot: `
/[]/;
 ~~
 This character class matches no characters because it is empty.
`,
		},
		{
			code: `
/a[]b/;
`,
			snapshot: `
/a[]b/;
  ~~
  This character class matches no characters because it is empty.
`,
		},
		{
			code: `
/[]+/;
`,
			snapshot: `
/[]+/;
 ~~
 This character class matches no characters because it is empty.
`,
		},
		{
			code: `
/[]?/;
`,
			snapshot: `
/[]?/;
 ~~
 This character class matches no characters because it is empty.
`,
		},
		{
			code: `
/[]*/;
`,
			snapshot: `
/[]*/;
 ~~
 This character class matches no characters because it is empty.
`,
		},
		{
			code: `
/([])/;
`,
			snapshot: `
/([])/;
  ~~
  This character class matches no characters because it is empty.
`,
		},
		{
			code: `
/(?:[])/;
`,
			snapshot: `
/(?:[])/;
    ~~
    This character class matches no characters because it is empty.
`,
		},
		{
			code: `
new RegExp("[]");
`,
			snapshot: `
new RegExp("[]");
            ~~
            This character class matches no characters because it is empty.
`,
		},
		{
			code: `
RegExp("a[]b");
`,
			snapshot: `
RegExp("a[]b");
         ~~
         This character class matches no characters because it is empty.
`,
		},
	],
	valid: [
		`/[a]/;`,
		`/[abc]/;`,
		`/[a-z]/;`,
		`/[^]/;`,
		`/[^a]/;`,
		String.raw`/[\d]/;`,
		String.raw`/[\w]/;`,
		String.raw`/[\s]/;`,
		`/./;`,
		`/a/;`,
		`new RegExp("[a]");`,
		`new RegExp(variable);`,
		`/[0-9]/;`,
		`/[A-Z]/;`,
	],
});
