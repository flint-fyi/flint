import { ruleTester } from "../ruleTester.ts";
import privatePresence from "./privatePresence.ts";

ruleTester.describe(privatePresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`private\` is expected to be present.
}
`,
		},
		{
			code: `
{
  "other": true
}
`,
			snapshot: `
{
~
Property \`private\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "private": {}
}`,
	],
});
