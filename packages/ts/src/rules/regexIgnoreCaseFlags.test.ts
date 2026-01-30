import rule from "./regexIgnoreCaseFlags.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[aA]/;
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
			snapshot: `
/[aAbBcC]/;
 ~~~~~~~~
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
		String.raw`/[0-9A-Fa-f]/;`,
		String.raw`/[09A-Da-d]/;`,
		String.raw`/[A-Fa-f]/;`,
		String.raw`/^\\c[A-Za-z]$/;`,
	],
});
