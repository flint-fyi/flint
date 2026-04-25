import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.descriptionPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`description\` is expected to be present.
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
Property \`description\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "description": "Example description."
}`,
	],
});
