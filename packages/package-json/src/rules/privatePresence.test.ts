import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.privatePresence, {
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
