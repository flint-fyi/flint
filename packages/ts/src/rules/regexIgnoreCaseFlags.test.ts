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
/[a-zA-Z]/;
`,
			snapshot: `
/[a-zA-Z]/;
 ~~~~~~~~
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
		{
			code: `
/[a-zA-Z0-9]/;
`,
			snapshot: `
/[a-zA-Z0-9]/;
 ~~~~~~~~~~~
 This character class can be simplified by using the \`i\` flag.
`,
		},
	],
	valid: [
		`/[a-z]/;`,
		`/[A-Z]/;`,
		`/[abc]/;`,
		`/[a-z]/i;`,
		`/[a-zA-Z]/i;`,
		`/[0-9]/;`,
		`/[^aA]/;`,
		`/[aB]/;`,
	],
});
