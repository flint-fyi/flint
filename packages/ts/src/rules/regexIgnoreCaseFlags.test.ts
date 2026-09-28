import rule from "./regexIgnoreCaseFlags.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[aA]/;
`,
			output: `
/[a]/i;
`,
			snapshot: `
/[aA]/;
 ~~~~
 This character class can be simplified by using the \`i\` flag.
`,
		},
		{
			code: `
/[aAbBcC]/;
`,
			output: `
/[abc]/i;
`,
			snapshot: `
/[aAbBcC]/;
 ~~~~~~~~
 This character class can be simplified by using the \`i\` flag.
`,
		},
		{
			code: `
/[0-9aAbB]/;
`,
			output: `
/[0-9ab]/i;
`,
			snapshot: `
/[0-9aAbB]/;
 ~~~~~~~~~
 This character class can be simplified by using the \`i\` flag.
`,
		},
	],
	valid: [
		`/[^aA]/;`,
		`/[0-9]/;`,
		`/[a-z]/;`,
		`/[A-Z]/;`,
		`/[a-z]/i;`,
		`/[a-zA-Z]/;`,
		`/[a-zA-Z]/i;`,
		`/[a-zA-Z0-9]/;`,
		`/[aB]/;`,
		`/[abc]/;`,
		"/[0-9A-Fa-f]/;",
		"/[09A-Da-d]/;",
		"/[A-Fa-f]/;",
		String.raw`/^\\c[A-Za-z]$/;`,
	],
});
